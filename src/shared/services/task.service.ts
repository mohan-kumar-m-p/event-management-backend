import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Athlete } from '../../athlete/athlete.entity';
import { Coach } from '../../coach/coach.entity';
import { Manager } from '../../manager/manager.entity';

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);

  constructor(
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Kolkata' })
  async resetMeals() {
    await this.athleteRepository.update({}, { mealsRemaining: 5 });
    await this.coachRepository.update({}, { mealsRemaining: 5 });
    await this.managerRepository.update({}, { mealsRemaining: 5 });

    this.logger.log('Meals reset successfully');
  }
}
