import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventSportGroup } from 'src/event/enums/event-sport-group.enum';
import { Repository } from 'typeorm';
import { AthleteHeat } from '../athlete-heat/athlete-heat.entity';
import { Athlete } from '../athlete/athlete.entity';
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

    console.log(`The number of athletes are: ${athletes.length}`);
    if (athletes.length === 0) {
      throw new NotFoundException('No athletes registered for this event');
    }

    // Number of lanes (assuming 8 lanes for athletics and 6 for swimming)
    const lanes = round.event.sportGroup === EventSportGroup.Athletics ? 8 : 6;
    const minAthletesPerHeat = lanes / 2;
    const numberOfHeats = Math.ceil(athletes.length / lanes);

    // Generate heats
    const heats: Heat[] = [];
    for (let i = 0; i < numberOfHeats; i++) {
      const heat = this.heatRepository.create({
        heatName: `Heat ${i + 1}`,
        round: round,
        athletePlacements: new Array(lanes).fill(null), // Initialize with null values
      });
      heats.push(await this.heatRepository.save(heat));
    }

    // Randomly assign athletes to heats and lanes
    let currentHeatIndex = 0;
    for (const athlete of athletes) {
      const heat = heats[currentHeatIndex];
      const lane = heat.athletePlacements.findIndex(
        (placement) => placement === null,
      );

      heat.athletePlacements[lane] = athlete.chestNumber;

      const athleteHeat = this.athleteHeatRepository.create({
        athlete,
        heat,
        lane: lane + 1,
      });
      await this.athleteHeatRepository.save(athleteHeat);

      // Move to the next heat
      currentHeatIndex = (currentHeatIndex + 1) % numberOfHeats;
    }

    // Check for imbalances in the last heat
    const lastHeat = heats[heats.length - 1];
    const athletesInLastHeat = lastHeat.athletePlacements.filter(
      (placement) => placement !== null,
    ).length;

    if (athletesInLastHeat < minAthletesPerHeat) {
      const deficit = minAthletesPerHeat - athletesInLastHeat;
      const secondLastHeat = heats[heats.length - 2];

      const athletesToMove = secondLastHeat.athletePlacements
        .filter((placement) => placement !== null)
        .slice(-deficit);

      // Move athletes from the second-last heat to the last heat
      for (const chestNumber of athletesToMove) {
        const laneInSecondLastHeat =
          secondLastHeat.athletePlacements.indexOf(chestNumber);
        secondLastHeat.athletePlacements[laneInSecondLastHeat] = null;

        const laneInLastHeat = lastHeat.athletePlacements.findIndex(
          (placement) => placement === null,
        );
        lastHeat.athletePlacements[laneInLastHeat] = chestNumber;

        const athleteHeat = await this.athleteHeatRepository.findOne({
          where: { athlete: { chestNumber }, heat: secondLastHeat },
        });
        athleteHeat.heat = lastHeat;
        athleteHeat.lane = laneInLastHeat + 1;

        await this.athleteHeatRepository.save(athleteHeat);
      }
    }

    // Return all heats for the round
    return heats;
  }
}
