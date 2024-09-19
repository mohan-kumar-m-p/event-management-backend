import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as QRCode from 'qrcode';
import { Repository } from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { School } from '../school/school.entity';
import { MealSummary } from './mealSummary.entity';

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
    @InjectRepository(MealSummary)
    private readonly mealSummaryRepository: Repository<MealSummary>,
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
      throw new HttpException(
        `Payment required for school with affiliation number ${affiliationNumber} `,
        402,
      );
    }

    if (person.mealsRemaining <= 0) {
      throw new BadRequestException('No meals remaining');
    }

    person.mealsRemaining -= 1;
    const today = new Date();
    const ISTOffset = 5.5 * 60 * 60 * 1000;
    const todayIST = new Date(today.getTime() + ISTOffset);
    const todayISTString = todayIST.toISOString().split('T')[0];
    if (!person.mealDetails[todayISTString]) {
      throw new BadRequestException('No meal details found for today');
    }
    person.mealDetails[todayISTString] -= 1;
    const result = {
      name: person.name,
      entity: role,
      mealsRemaining: person.mealsRemaining,
      mealDetails: person.mealDetails,
    };
    const todayWithoutTime = new Date(
      todayIST.getFullYear(),
      todayIST.getMonth(),
      todayIST.getDate(),
    ); // Get the date without time

    const mealSummary = await this.mealSummaryRepository.findOne({
      where: { date: todayWithoutTime },
    });

    if (!mealSummary) {
      throw new NotFoundException('Meal summary for today not found');
    }

    mealSummary.mealsConsumed += 1; // Increment the mealsConsumed count
    await this.mealSummaryRepository.save(mealSummary);

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
    userId?: string,
    userEntity?: string,
  ): Promise<any> {
    if (userId) {
      let person;
      // check if userId is valid
      if (userEntity === 'athlete') {
        person = await this.athleteRepository.findOne({
          where: { registrationId: userId },
          relations: ['school'],
        });
        if (!person) {
          throw new NotFoundException(`Athlete with ID ${userId} not found`);
        }
      } else if (userEntity === 'manager') {
        person = await this.managerRepository.findOne({
          where: { managerId: userId },
          relations: ['school'],
        });
        if (!person) {
          throw new NotFoundException(`Manager with ID ${userId} not found`);
        }
      } else if (userEntity === 'coach') {
        person = await this.coachRepository.findOne({
          where: { coachId: userId },
          relations: ['school'],
        });
        if (!person) {
          throw new NotFoundException(`Coach with ID ${userId} not found`);
        }
      }

      const affiliationNumber = person.school.affiliationNumber;
      const isEligible = await this.checkIfEligibleForMeal(affiliationNumber);
      if (!isEligible) {
        throw new HttpException(
          `Payment required for school with affiliation number ${affiliationNumber} `,
          402,
        );
      }
      return {
        mealsRemaining: person.mealsRemaining,
        mealDetails: person.mealDetails,
      };
    }

    let person;
    switch (entity) {
      case 'athlete':
        person = await this.athleteRepository.findOne({
          where: { registrationId: id },
          relations: ['school'],
        });
        if (!person) {
          throw new NotFoundException('Athlete not found');
        }
        break;
      case 'manager':
        person = await this.managerRepository.findOne({
          where: { managerId: id },
          relations: ['school'],
        });
        if (!person) {
          throw new NotFoundException('Manager not found');
        }
        break;
      case 'coach':
        person = await this.coachRepository.findOne({
          where: { coachId: id },
          relations: ['school'],
        });
        if (!person) {
          throw new NotFoundException('Coach not found');
        }
        break;
      default:
        throw new BadRequestException('Invalid entity');
    }

    const affiliationNumber = person.school.affiliationNumber;
    const isEligible = await this.checkIfEligibleForMeal(affiliationNumber);
    if (!isEligible) {
      throw new HttpException(
        `Payment required for school with affiliation number ${affiliationNumber} `,
        402,
      );
    }

    return {
      mealsRemaining: person.mealsRemaining,
      mealDetails: person.mealDetails,
    };
  }

  async getTotalMealsSummary(): Promise<any> {
    const mealSummary = await this.mealSummaryRepository.find();

    if (!mealSummary || mealSummary.length === 0) {
      throw new NotFoundException('No meal summary found');
    }

    const result = mealSummary.reduce((acc, meal) => {
      const dateKey = meal.date.toString().split('T')[0]; // Convert the date to 'YYYY-MM-DD' format
      acc[dateKey] = {
        totalMeals: meal.totalMeals,
        mealsConsumed: meal.mealsConsumed,
      };
      return acc;
    }, {});
    return result;
  }

  async checkIfEligibleForMeal(affiliationNumber: string): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: affiliationNumber },
    });
    return school.isPaid === 'true';
  }
}
