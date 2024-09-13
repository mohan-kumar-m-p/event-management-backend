import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventSportGroup } from 'src/event/enums/event-sport-group.enum';
import { In, Repository } from 'typeorm';
import { AthleteHeat } from '../athlete-heat/athlete-heat.entity';
import { Athlete } from '../athlete/athlete.entity';
import { Round as RoundEnum } from '../round/enums/round.enum';
import { Round } from '../round/round.entity';
import { Heat } from './heat.entity';

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

  async generateQualifierHeats(id: string): Promise<any> {
    const round = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });

    if (!round) {
      throw new NotFoundException(`Round with ID ${id} not found`);
    }

    if (round.round != RoundEnum.Heats) {
      throw new BadRequestException(
        `Method requires a 'Heats' round, but round passed is '${round.round}'`,
      );
    }

    // Get athletes registered for the event
    const athletes = await this.athleteRepository.find({
      where: { events: { eventId: round.event.eventId } },
      relations: ['events'],
    });

    console.log(
      `Total number of athletes registered for this round: ${athletes.length}`,
    );

    if (athletes.length === 0) {
      throw new NotFoundException('No athletes registered for this event');
    }

    const existingHeats = await this.heatRepository.find({
      where: { round: { roundId: id } },
    });

    if (existingHeats.length > 0) {
      // Fetch athlete heats to remove
      const athleteHeatsToRemove = await this.athleteHeatRepository.find({
        where: {
          heat: { heatId: In(existingHeats.map((heat) => heat.heatId)) },
        },
      });

      await this.athleteHeatRepository.remove(athleteHeatsToRemove); // Delete athlete heats
      // Check if there are existing heats
      await this.heatRepository.remove(existingHeats); // Delete existing heats
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
    const athleteHeats = [];
    let athleteIndex = 0;
    for (let i = 0; i < numberOfHeats; i++) {
      const heat = heats[i];
      const athletesInHeat =
        i < fullHeats ? lanes : i === fullHeats ? remainingAthletes : 0;
      for (let j = 0; j < athletesInHeat; j++) {
        const athlete = athletes[athleteIndex++];
        const athleteHeat = await this.athleteHeatRepository.create({
          athlete,
          heat,
          lane: j + 1,
        });
        if (athleteHeat) {
          athleteHeats.push(athleteHeat);
        } else {
          console.error(
            `Error assigning athlete ${athlete.name} to heat ${heat.heatName}, lane ${j + 1}`,
          );
        }
        heat.athletePlacements[j] = {
          registrationId: athlete.registrationId,
          name: athlete.name,
          chestNumber: athlete.chestNumber,
          position: athleteHeat.position || null,
          time: athleteHeat.time || null,
        };
      }
    }

    await this.athleteHeatRepository.save(athleteHeats);

    // Balance the last two heats if necessary
    if (remainingAthletes > 0 && remainingAthletes < minAthletesPerHeat) {
      const lastHeat = heats[numberOfHeats - 1];
      const secondLastHeat = heats[numberOfHeats - 2];
      const athletesToMove = minAthletesPerHeat - remainingAthletes;

      for (let i = 0; i < athletesToMove; i++) {
        const lastIndex = secondLastHeat.athletePlacements.length - (i + 1);
        // const lastChestNumber =
        //   secondLastHeat.athletePlacements[lastIndex].chestNumber;
        const lastAthlete = secondLastHeat.athletePlacements[lastIndex];
        const athleteToMove = await this.athleteRepository.findOne({
          where: { chestNumber: lastAthlete.chestNumber },
        });
        // secondLastHeat.athletePlacements[lastIndex].chestNumber = null;
        secondLastHeat.athletePlacements[lastIndex] = null;
        const emptyLane = lastHeat.athletePlacements.findIndex(
          (lane) => lane === null,
        );
        lastHeat.athletePlacements[emptyLane] = lastAthlete;

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

    return heats.map((heat) => ({
      heatName: heat.heatName,
      athletePlacements: heat.athletePlacements,
      heatId: heat.heatId,
      roundId: heat.round.roundId,
      eventId: heat.round.event.eventId,
      round: heat.round.round,
      event: `${heat.round.event.name} ${heat.round.event.category} ${heat.round.event.gender == 'M' ? 'Boys' : 'Girls'}`,
    }));
  }

  async generateSemifinalHeats(id: string): Promise<any> {
    const semifinalRound = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });

    if (!semifinalRound) {
      throw new NotFoundException(`Semifinal round with ID ${id} not found`);
    }

    if (semifinalRound.round != RoundEnum.Semifinals) {
      throw new BadRequestException(
        `Method requires a 'Semifinals' round, but round passed is '${semifinalRound.round}'`,
      );
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

    const existingHeats = await this.heatRepository.find({
      where: { round: { roundId: id } },
    });

    if (existingHeats.length > 0) {
      // Fetch athlete heats to remove
      const athleteHeatsToRemove = await this.athleteHeatRepository.find({
        where: {
          heat: { heatId: In(existingHeats.map((heat) => heat.heatId)) },
        },
      });

      await this.athleteHeatRepository.remove(athleteHeatsToRemove); // Delete athlete heats
      // Check if there are existing heats
      await this.heatRepository.remove(existingHeats); // Delete existing heats
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

        const newAthleteHeat = this.athleteHeatRepository.create({
          athlete,
          heat,
          lane: j + 1,
        });
        await this.athleteHeatRepository.save(newAthleteHeat);
        heat.athletePlacements[j] = {
          registrationId: athlete.registrationId,
          name: athlete.name,
          chestNumber: athlete.chestNumber,
          position: athleteHeat.position || null,
          time: athleteHeat.time || null,
        };
      }
      await this.heatRepository.save(heat);
      semiFinalHeats.push(heat);
    }

    // return semiFinalHeats;
    return semiFinalHeats.map((heat) => ({
      heatName: heat.heatName,
      athletePlacements: heat.athletePlacements,
      heatId: heat.heatId,
      roundId: heat.round.roundId,
      eventId: heat.round.event.eventId,
      round: heat.round.round,
      event: `${heat.round.event.name} ${heat.round.event.category} ${heat.round.event.gender == 'M' ? 'Boys' : 'Girls'}`,
    }));
  }

  async generateFinalHeat(id: string): Promise<any> {
    const finalRound = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });

    if (!finalRound) {
      throw new NotFoundException(`Final round with ID ${id} not found`);
    }

    if (finalRound.round != RoundEnum.Finals) {
      throw new BadRequestException(
        `Method requires a 'Final' round, but round passed is '${finalRound.round}'`,
      );
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
    for (let i = 0; i < 2; i++) {
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
      .flat() // Flatten the array to ungroup by heatId
      .filter((athlete) => athlete.time) // Ensure time is defined
      .sort((a, b) => this.parseTimeToMs(a.time) - this.parseTimeToMs(b.time))
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
      const newAthleteHeat = this.athleteHeatRepository.create({
        athlete,
        heat: finalHeat,
        lane: i + 1,
      });
      await this.athleteHeatRepository.save(newAthleteHeat);
      finalHeat.athletePlacements[i] = {
        registrationId: athlete.registrationId,
        name: athlete.name,
        chestNumber: athlete.chestNumber,
        position: newAthleteHeat.position || null,
        time: newAthleteHeat.time || null,
      };
    }

    await this.heatRepository.save(finalHeat);

    // return finalHeat;
    return {
      heatName: finalHeat.heatName,
      athletePlacements: finalHeat.athletePlacements,
      heatId: finalHeat.heatId,
      roundId: finalHeat.round.roundId,
      eventId: finalHeat.round.event.eventId,
      round: finalHeat.round.round,
      event: `${finalHeat.round.event.name} ${finalHeat.round.event.category} ${finalHeat.round.event.gender == 'M' ? 'Boys' : 'Girls'}`,
    };
  }

  private parseTimeToMs(timeString: string): number {
    const [minutes, seconds, milliseconds] = timeString.split(':').map(Number);
    return (minutes * 60 + seconds) * 1000 + milliseconds;
  }
}
