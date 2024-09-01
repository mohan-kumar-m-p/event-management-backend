import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Repository } from 'typeorm';
import { Accommodation } from './accommodation.entity';
import { Manager } from 'src/manager/manager.entity';
import { Coach } from 'src/coach/coach.entity';

@Injectable()
export class AccommodationService {
  constructor(
    @InjectRepository(Accommodation)
    private readonly accommodationRepository: Repository<Accommodation>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
  ) {}

  async findAll(): Promise<Accommodation[]> {
    const accommodations = await this.accommodationRepository.find();
    if (!accommodations) {
      throw new NotFoundException('No accommodations found');
    }
    return accommodations;
  }

  async findOne(id: string): Promise<Accommodation> {
    const accommodation = await this.accommodationRepository.findOne({
      where: { accommodationId: id },
    });
    if (!accommodation) {
      throw new NotFoundException(`Accommodation with ID ${id} not found`);
    }
    return accommodation;
  }

  async assignAccommodation(
    accommodationId: string,
    users: { id: string; type: 'athlete' | 'manager' | 'coach' }[],
  ): Promise<Accommodation> {
    const accommodation = await this.accommodationRepository.findOne({
      where: { accommodationId: accommodationId },
    });
    if (!accommodation) {
      throw new NotFoundException(
        `Accommodation with ID ${accommodationId} not found`,
      );
    }

    if (users.length > accommodation.vacancies) {
      throw new BadRequestException(
        `Not enough vacancies. Available: ${accommodation.vacancies}, Required: ${users.length}`,
      );
    }

    const personsToAssign = await Promise.all(
      users.map(async (user) => {
        switch (user.type) {
          case 'athlete':
            return this.athleteRepository.findOne({
              where: { registrationId: user.id },
            });
          case 'manager':
            return this.managerRepository.findOne({
              where: { managerId: user.id },
            });
          case 'coach':
            return this.coachRepository.findOne({
              where: { coachId: user.id },
            });
        }
      }),
    );

    if (personsToAssign.some((person) => !person)) {
      throw new NotFoundException('One or more persons not found');
    }

    if (personsToAssign.some((person) => person.accommodation !== null)) {
      throw new BadRequestException(
        'One or more persons is already assigned to an accommodation',
      );
    }

    const updatedAccommodation = await this.accommodationRepository.save({
      ...accommodation,
      vacancies: accommodation.vacancies - personsToAssign.length,
    });

    await Promise.all(
      personsToAssign.map(async (person, index) => {
        person.accommodation = updatedAccommodation;
        switch (users[index].type) {
          case 'athlete':
            await this.athleteRepository.save(person);
            break;
          case 'manager':
            await this.managerRepository.save(person);
            break;
          case 'coach':
            await this.coachRepository.save(person);
            break;
        }
      }),
    );

    return updatedAccommodation;
  }
}
