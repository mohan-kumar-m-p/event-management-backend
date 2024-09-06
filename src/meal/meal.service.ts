import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Coach } from 'src/coach/coach.entity';
import { Manager } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';

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

    const url = `${backendUrl}/verify-meal?${queryParam}=${queryValue}`;

    // Generate QR code
    const qrCode = await QRCode.toDataURL(url);
    return qrCode;
  }

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
      throw new BadRequestException('No meals remaining');
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
