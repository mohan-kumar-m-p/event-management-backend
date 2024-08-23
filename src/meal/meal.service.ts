import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Coach } from 'src/coach/coach.entity';
import { Manager } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
@Injectable()
export class MealService {
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
  ) {}

  async verifyMeal(
    id: string,
    role: 'athlete' | 'manager' | 'coach',
  ): Promise<void> {
    let person;
    if (role === 'athlete') {
      person = await this.athleteRepository.findOne({
        where: { registrationId: id },
      });
    } else if (role === 'manager') {
      person = await this.managerRepository.findOne({
        where: { managerId: id },
      });
    } else if (role === 'coach') {
      person = await this.coachRepository.findOne({ where: { coachId: id } });
    }

    if (!person) {
      throw new NotFoundException(`${role} not found`);
    }

    if (person.mealsRemaining <= 0) {
      throw new Error('No meals remaining');
    }

    person.mealsRemaining -= 1;
    if (role === 'athlete') {
      await this.athleteRepository.save(person as Athlete);
    } else if (role === 'manager') {
      await this.managerRepository.save(person as Manager);
    } else if (role === 'coach') {
      await this.coachRepository.save(person as Coach);
    }
  }
}
