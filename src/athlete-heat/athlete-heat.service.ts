import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AthleteHeat } from './athlete-heat.entity';
import { Heat } from 'src/heat/heat.entity';

@Injectable()
export class AthleteHeatService {
  constructor(
    @InjectRepository(AthleteHeat)
    private readonly athleteHeatRepository: Repository<AthleteHeat>,
    @InjectRepository(Heat)
    private readonly heatRepository: Repository<Heat>,
  ) {}

  async assignResult(
    athleteRegistrationId: string,
    heat: string,
    resultData: {
      position?: number;
      time?: string;
      qualifiedNextRound?: boolean;
    },
  ): Promise<AthleteHeat> {
    const athleteHeat = await this.athleteHeatRepository.findOne({
      where: {
        athlete: { registrationId: athleteRegistrationId },
        heat: { heatId: heat },
      },
      relations: ['athlete', 'heat'],
    });

    if (!athleteHeat) {
      throw new NotFoundException('AthleteHeat not found');
    }

    // Find the athletePlacement by registrationId
    const athletePlacement = athleteHeat.heat.athletePlacements.find(
      (placement) => placement.registrationId === athleteRegistrationId,
    );

    if (resultData.position !== undefined) {
      athleteHeat.position = resultData.position;
      athletePlacement.position = resultData.position;
    }

    if (resultData.time !== undefined) {
      athleteHeat.time = resultData.time;
      athletePlacement.time = resultData.time;
    }

    if (resultData.qualifiedNextRound !== undefined) {
      athleteHeat.qualifiedNextRound = resultData.qualifiedNextRound;
    }

    await this.athleteHeatRepository.save(athleteHeat);
    await this.heatRepository.save(athleteHeat.heat);
    const heatId = athleteHeat.heat.heatId;
    const registrationId = athleteHeat.athlete.registrationId;
    delete athleteHeat.athlete;
    delete athleteHeat.heat;
    const result = {
      ...athleteHeat,
      heatId: heatId,
      registrationId: registrationId,
    };

    return result;
  }

  async getAthleteHeatsByRound(roundId: string): Promise<any> {
    const athleteHeats = await this.athleteHeatRepository.find({
      relations: ['athlete', 'heat'],
      where: {
        heat: { round: { roundId: roundId } },
      },
    });

    return athleteHeats.map((athleteHeat) => ({
      registrationId: athleteHeat.athlete.registrationId,
      heatId: athleteHeat.heat.heatId,
      athleteName: athleteHeat.athlete.name,
      chestNumber: athleteHeat.athlete.chestNumber,
      heatName: athleteHeat.heat.heatName,
      lane: athleteHeat.lane,
      position: athleteHeat.position,
      time: athleteHeat.time,
      qualifiedNextRound: athleteHeat.position,
    }));
  }
}
