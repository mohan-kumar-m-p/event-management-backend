import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as QRCode from 'qrcode';
import { Athlete } from 'src/athlete/athlete.entity';
import { Coach } from 'src/coach/coach.entity';
import { Manager } from 'src/manager/manager.entity';
import { School } from 'src/school/school.entity';
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
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async generateQRCode(
    id: string,
    entity: string,
    athleteId?: string,
  ): Promise<string> {
    const backendUrl = process.env.BACKEND_URL;
    const entityId = {
      athlete: 'registrationId',
      manager: 'managerId',
      coach: 'coachId',
    };
    let queryParam, queryValue;
    if (athleteId) {
      // check if athleteId is valid
      const athlete = await this.athleteRepository.findOne({
        where: { registrationId: athleteId },
        relations: ['school'],
      });
      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      let parent;
      switch (entity) {
        case 'manager':
          parent = await this.managerRepository.findOne({
            where: { managerId: id },
            relations: ['school'],
          });
          if (!parent) {
            throw new NotFoundException('Manager not found');
          }
          break;
        case 'coach':
          parent = await this.coachRepository.findOne({
            where: { coachId: id },
            relations: ['school'],
          });
          if (!parent) {
            throw new NotFoundException('Coach not found');
          }
          break;
        default:
          throw new BadRequestException('Invalid manager/coach entity');
      }

      // check if athlete and manager/coach are in the same school
      if (
        athlete &&
        parent &&
        athlete.school.affiliationNumber !== parent.school.affiliationNumber
      ) {
        throw new BadRequestException(
          'Athlete and manager/coach are not from the same school',
        );
      }

      queryParam = 'registrationId';
      queryValue = athleteId;
    } else {
      queryParam = entityId[entity];
      queryValue = id;
    }

    const url = `${backendUrl}/api/v1/meal/verify-meal?${queryParam}=${queryValue}`;

    // Generate QR code
    const qrCode = await QRCode.toDataURL(url);
    return qrCode;
  }

  async verifyMeal(
    id: string,
    role: 'athlete' | 'manager' | 'coach',
  ): Promise<any> {
    let person;
    if (role === 'athlete') {
      person = await this.athleteRepository.findOne({
        where: { registrationId: id },
        relations: ['school'],
      });
    } else if (role === 'manager') {
      person = await this.managerRepository.findOne({
        where: { managerId: id },
        relations: ['school'],
      });
    } else if (role === 'coach') {
      person = await this.coachRepository.findOne({
        where: { coachId: id },
        relations: ['school'],
      });
    }

    if (!person) {
      throw new NotFoundException(`${role} not found`);
    }

    const affiliationNumber = person.school.affiliationNumber;
    const isEligible = await this.checkIfEligibleForMeal(affiliationNumber);
    if (!isEligible) {
      throw new BadRequestException('Not eligible for meal');
    }

    if (person.mealsRemaining <= 0) {
      throw new BadRequestException('No meals remaining');
    }

    person.mealsRemaining -= 1;
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    person.mealDetails[todayString] -= 1;
    const result = {
      name: person.name,
      entity: role,
      mealsRemaining: person.mealsRemaining,
    };

    if (role === 'athlete') {
      await this.athleteRepository.save(person as Athlete);
      return {
        ...result,
        chestNumber: person.chestNumber,
      };
    } else if (role === 'manager') {
      await this.managerRepository.save(person as Manager);
      return result;
    } else if (role === 'coach') {
      await this.coachRepository.save(person as Coach);
      return result;
    }
  }

  async getMealDetails(
    id: string,
    entity: string,
    athleteId?: string,
  ): Promise<any> {
    if (athleteId) {
      // check if athleteId is valid
      const athlete = await this.athleteRepository.findOne({
        where: { registrationId: athleteId },
      });

      if (!athlete) {
        throw new NotFoundException('Athlete not found');
      }

      return {
        mealsRemaining: athlete.mealsRemaining,
        mealDetails: athlete.mealDetails,
      };
    }

    let person;
    switch (entity) {
      case 'athlete':
        person = await this.athleteRepository.findOne({
          where: { registrationId: id },
          select: ['mealsRemaining', 'mealDetails'],
        });
        if (!person) {
          throw new NotFoundException('Athlete not found');
        }
        break;
      case 'manager':
        person = await this.managerRepository.findOne({
          where: { managerId: id },
          select: ['mealsRemaining', 'mealDetails'],
        });
        if (!person) {
          throw new NotFoundException('Manager not found');
        }
        break;
      case 'coach':
        person = await this.coachRepository.findOne({
          where: { coachId: id },
          select: ['mealsRemaining', 'mealDetails'],
        });
        if (!person) {
          throw new NotFoundException('Coach not found');
        }
        break;
      default:
        throw new BadRequestException('Invalid entity');
    }

    return {
      mealsRemaining: person.mealsRemaining,
      mealDetails: person.mealDetails,
    };
  }

  async checkIfEligibleForMeal(affiliationNumber: string): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: affiliationNumber },
    });
    return school.isPaid === 'true';
  }
}
