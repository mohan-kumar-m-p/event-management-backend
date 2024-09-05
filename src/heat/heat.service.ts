import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventSportGroup } from 'src/event/enums/event-sport-group.enum';
import { Repository } from 'typeorm';
import { AthleteHeat } from '../athlete-heat/athlete-heat.entity';
import { Athlete } from '../athlete/athlete.entity';
import { Round } from '../round/round.entity';
import { Heat } from './heat.entity';
import { Round as RoundEnum } from '../round/enums/round.enum';

@Injectable()
export class HeatService {
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Heat)
    private readonly heatRepository: Repository<Heat>,
    @InjectRepository(AthleteHeat)
    private readonly athleteHeatRepository: Repository<AthleteHeat>,
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
  ) {}

  async generateQualifierHeats(id: string): Promise<Heat[]> {
    const round = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });

    if (!round) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }

    // Get athletes registered for the event
    const athletes = await this.athleteRepository.find({
      where: { events: { eventId: round.event.eventId } },
      relations: ['events'],
    });

    if (athletes.length === 0) {
      throw new NotFoundException('No athletes registered for this event');
    }

    // Number of lanes (assuming 8 lanes for athletics and 6 for swimming)
    const lanes = round.event.sportGroup === EventSportGroup.Athletics ? 8 : 6;
    const minAthletesPerHeat = lanes / 2;
    const fullHeats = Math.floor(athletes.length / lanes);
    const remainingAthletes = athletes.length % lanes;
    const numberOfHeats = remainingAthletes > 0 ? fullHeats + 1 : fullHeats;

    // Generate heats
    const heats: Heat[] = [];
    for (let i = 0; i < numberOfHeats; i++) {
      const heat = this.heatRepository.create({
        heatName: `Heat ${i + 1}`,
        round: round,
        athletePlacements: new Array(lanes).fill(null),
      });
      heats.push(await this.heatRepository.save(heat));
    }

    // Assign athletes to heats
    let athleteIndex = 0;
    for (let i = 0; i < numberOfHeats; i++) {
      const heat = heats[i];
      const athletesInHeat =
        i < fullHeats ? lanes : i === fullHeats ? remainingAthletes : 0;
      for (let j = 0; j < athletesInHeat; j++) {
        const athlete = athletes[athleteIndex++];
        heat.athletePlacements[j] = athlete.chestNumber;
        const athleteHeat = await this.athleteHeatRepository.create({
          athlete,
          heat,
          lane: j + 1,
        });
        try {
          await this.athleteHeatRepository.save(athleteHeat);
        } catch (error) {
          console.error(
            `Error assigning athlete ${athlete.name} to heat ${heat.heatName}, lane ${j + 1}`,
          );
        }
      }
    }

    // Balance the last two heats if necessary
    if (remainingAthletes > 0 && remainingAthletes < minAthletesPerHeat) {
      const lastHeat = heats[numberOfHeats - 1];
      const secondLastHeat = heats[numberOfHeats - 2];
      const athletesToMove = minAthletesPerHeat - remainingAthletes;

      for (let i = 0; i < athletesToMove; i++) {
        const lastIndex = secondLastHeat.athletePlacements.length - (i + 1);
        const lastChestNumber = secondLastHeat.athletePlacements[lastIndex];
        const athleteToMove = await this.athleteRepository.findOne({
          where: { chestNumber: lastChestNumber },
        });
        secondLastHeat.athletePlacements[lastIndex] = null;
        const emptyLane = lastHeat.athletePlacements.findIndex(
          (lane) => lane === null,
        );
        lastHeat.athletePlacements[emptyLane] = athleteToMove.chestNumber;

        const athleteHeat = await this.athleteHeatRepository.findOne({
          where: {
            athlete: { registrationId: athleteToMove.registrationId },
            heat: { heatId: secondLastHeat.heatId },
          },
          relations: ['athlete', 'heat'],
        });
        if (athleteHeat) {
          athleteHeat.heat = lastHeat;
          athleteHeat.lane = emptyLane + 1;
          await this.athleteHeatRepository.save(athleteHeat);
        } else {
          console.error(
            `AthleteHeat record not found for athlete ${athleteToMove.name} in heat ${secondLastHeat.heatId}`,
          );
        }
      }
    }

    // Save updated heats
    await Promise.all(heats.map((heat) => this.heatRepository.save(heat)));

    return heats;
  }

  async generateSemifinalHeats(id: string): Promise<Heat[]> {
    const semifinalRound = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });

    if (!semifinalRound) {
      throw new NotFoundException(`Semifinal round with ID ${id} not found`);
    }

    const qualifyingRound = await this.roundRepository.findOne({
      where: {
        event: { eventId: semifinalRound.event.eventId },
        round: RoundEnum.Heats,
      },
    });

    if (!qualifyingRound) {
      throw new NotFoundException(
        `Qualifying round not found for event ${semifinalRound.event.eventId}`,
      );
    }

    const qualifiedAthletes = await this.athleteHeatRepository.find({
      where: { heat: { round: { roundId: qualifyingRound.roundId } } },
      relations: ['athlete', 'heat'],
      order: { position: 'ASC' },
      take: 24,
    });

    if (qualifiedAthletes.length !== 24) {
      throw new Error('Invalid number of athletes for semifinal');
    }

    const heatAssignments = [
      [1, 6, 7, 12, 13, 18, 19, 24],
      [2, 5, 8, 11, 14, 17, 20, 23],
      [3, 4, 9, 10, 15, 16, 21, 22],
    ];

    const semiFinalHeats: Heat[] = [];

    for (let i = 0; i < heatAssignments.length; i++) {
      const heat = this.heatRepository.create({
        heatName: `Semifinal Heat ${i + 1}`,
        round: semifinalRound,
        athletePlacements: new Array(8).fill(null),
      });
      await this.heatRepository.save(heat);

      for (let j = 0; j < heatAssignments[i].length; j++) {
        const athleteIndex = heatAssignments[i][j] - 1;
        const athleteHeat = qualifiedAthletes[athleteIndex];
        const athlete = athleteHeat.athlete;

        heat.athletePlacements[j] = athlete.chestNumber;

        const newAthleteHeat = this.athleteHeatRepository.create({
          athlete,
          heat,
          lane: j + 1,
          position: null, // Position will be determined after the semifinal race
        });
        await this.athleteHeatRepository.save(newAthleteHeat);
      }
      await this.heatRepository.save(heat);
      semiFinalHeats.push(heat);
    }

    return semiFinalHeats;
  }

  async generateFinalHeat(id: string): Promise<Heat> {
    const finalRound = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });

    if (!finalRound) {
      throw new NotFoundException(`Final round with ID ${id} not found`);
    }

    const semifinalRound = await this.roundRepository.findOne({
      where: {
        event: { eventId: finalRound.event.eventId },
        round: RoundEnum.Semifinals,
      },
    });

    if (!semifinalRound) {
      throw new NotFoundException(
        `Semifinal round not found for event ${semifinalRound.event.eventId}`,
      );
    }

    // Get all athletes from semifinal heats
    const semifinalAthletes = await this.athleteHeatRepository.find({
      where: { heat: { round: { roundId: semifinalRound.roundId } } },
      relations: ['athlete', 'heat'],
      order: { heat: { heatId: 'ASC' }, position: 'ASC', time: 'ASC' },
    });

    // Group athletes by heat
    const athletesByHeat = semifinalAthletes.reduce((acc, athlete) => {
      if (!acc[athlete.heat.heatId]) {
        acc[athlete.heat.heatId] = [];
      }
      acc[athlete.heat.heatId].push(athlete);
      return acc;
    }, {});

    // Select top 3 from each heat, then 2nd place from each heat
    const qualifiedAthletes: AthleteHeat[] = [];
    for (let i = 0; i < 3; i++) {
      for (const heatId in athletesByHeat) {
        if (athletesByHeat[heatId][i]) {
          qualifiedAthletes.push(athletesByHeat[heatId][i]);
        }
      }
    }

    // Select 2 fastest from remaining athletes
    const remainingAthletes = semifinalAthletes.filter(
      (athlete) => !qualifiedAthletes.includes(athlete),
    );
    const fastestRemaining = remainingAthletes
      .sort((a, b) => {
        if (!a.time || !b.time) return 0;
        return this.parseTimeToMs(a.time) - this.parseTimeToMs(b.time);
      })
      .slice(0, 2);

    // Combine qualified athletes
    const finalAthletes = [...qualifiedAthletes, ...fastestRemaining];

    // Create final heat
    const finalHeat = this.heatRepository.create({
      heatName: 'Final',
      round: finalRound,
      athletePlacements: new Array(8).fill(null),
    });
    await this.heatRepository.save(finalHeat);

    // Assign athletes to lanes
    for (let i = 0; i < finalAthletes.length; i++) {
      const athlete = finalAthletes[i].athlete;
      finalHeat.athletePlacements[i] = athlete.chestNumber;
      const newAthleteHeat = this.athleteHeatRepository.create({
        athlete,
        heat: finalHeat,
        lane: i + 1,
      });
      await this.athleteHeatRepository.save(newAthleteHeat);
    }

    await this.heatRepository.save(finalHeat);

    return finalHeat;
  }

  private parseTimeToMs(timeString: string): number {
    const [minutes, seconds, milliseconds] = timeString.split(':').map(Number);
    return (minutes * 60 + seconds) * 1000 + milliseconds;
  }
}
