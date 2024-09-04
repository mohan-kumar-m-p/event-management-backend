import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AthleteHeat } from './athlete-heat.entity';
import { Athlete } from 'src/athlete/athlete.entity';
import { Heat } from 'src/heat/heat.entity';

@Injectable()
export class AthleteHeatService {
  constructor(
    @InjectRepository(AthleteHeat)
    private readonly athleteHeatRepository: Repository<AthleteHeat>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Heat)
    private readonly heatRepository: Repository<Heat>,
  ) {}

  async assignResult(
    athleteRegistrationId: string,
    heat: string,
    resultData: { position?: number; time?: string },
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

    if (resultData.position !== undefined) {
      athleteHeat.position = resultData.position;
    }

    if (resultData.time !== undefined) {
      athleteHeat.time = resultData.time;
    }

    return this.athleteHeatRepository.save(athleteHeat);
  }
}
