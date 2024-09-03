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
    userId: string,
    role: 'athlete' | 'manager' | 'coach',
  ): Promise<Accommodation> {
    const accommodation = await this.accommodationRepository.findOne({
      where: { accommodationId: accommodationId },
      relations: ['athletes', 'managers', 'coaches'],
    });
    if (!accommodation) {
      throw new NotFoundException(
        `Accommodation with ID ${accommodationId} not found`,
      );
    }

    if (accommodation.vacancies < 1) {
      throw new BadRequestException(`No vacancy in ${accommodation.name}`);
    }

    let user;
    let repository;
    if (role === 'athlete') {
      user = await this.athleteRepository.findOne({
        where: { registrationId: userId },
        relations: ['accommodation'],
      });
      repository = this.athleteRepository;
    } else if (role === 'manager') {
      user = await this.managerRepository.findOne({
        where: { managerId: userId },
        relations: ['accommodation'],
      });
      repository = this.managerRepository;
    } else if (role === 'coach') {
      user = await this.coachRepository.findOne({
        where: { coachId: userId },
        relations: ['accommodation'],
      });
      repository = this.coachRepository;
    }

    if (!user) {
      throw new NotFoundException(`${role} with ID ${userId} not found`);
    }

    if (user.accommodation !== null) {
      throw new BadRequestException(
        `User is already assigned to an accommodation: Accommodation: ${user.accommodation.name}, Bed Number: ${user.bedNumber}`,
      );
    }

    // Find the next available bed number
    const occupiedBedNumbers = new Set([
      ...accommodation.athletes.map((a) => a.bedNumber),
      ...accommodation.managers.map((m) => m.bedNumber),
      ...accommodation.coaches.map((c) => c.bedNumber),
    ]);
    let bedNumber = 1;
    while (occupiedBedNumbers.has(bedNumber)) {
      bedNumber++;
    }

    if (bedNumber > accommodation.capacity) {
      throw new BadRequestException(
        `No available beds in ${accommodation.name}`,
      );
    }

    user.accommodation = accommodation;
    user.bedNumber = bedNumber;
    await repository.save(user);

    // Update the accommodation
    accommodation.vacancies -= 1;
    if (role === 'athlete') accommodation.athletes.push(user);
    if (role === 'manager') accommodation.managers.push(user);
    if (role === 'coach') accommodation.coaches.push(user);

    await this.accommodationRepository.save(accommodation);

    return this.accommodationRepository.findOne({
      where: { accommodationId: accommodationId },
      relations: ['athletes', 'managers', 'coaches'],
    });
  }

  async unassignAccommodation(
    userId: string,
    role: 'athlete' | 'manager' | 'coach',
  ): Promise<Accommodation> {
    let user;
    let repository;
    if (role === 'athlete') {
      user = await this.athleteRepository.findOne({
        where: { registrationId: userId },
        relations: ['accommodation'],
      });
      repository = this.athleteRepository;
    } else if (role === 'manager') {
      user = await this.managerRepository.findOne({
        where: { managerId: userId },
        relations: ['accommodation'],
      });
      repository = this.managerRepository;
    } else if (role === 'coach') {
      user = await this.coachRepository.findOne({
        where: { coachId: userId },
        relations: ['accommodation'],
      });
      repository = this.coachRepository;
    }

    if (!user) {
      throw new NotFoundException(`${role} with ID ${userId} not found`);
    }

    if (!user.accommodation) {
      throw new BadRequestException(
        `${role} is not assigned to any accommodation`,
      );
    }

    const accommodation = await this.accommodationRepository.findOne({
      where: { accommodationId: user.accommodation.accommodationId },
      relations: ['athletes', 'managers', 'coaches'],
    });

    if (!accommodation) {
      throw new NotFoundException(`Accommodation not found`);
    }

    // Update the accommodation
    accommodation.vacancies += 1;
    if (role === 'athlete') {
      accommodation.athletes = accommodation.athletes.filter(
        (a) => a.registrationId !== userId,
      );
    } else if (role === 'manager') {
      accommodation.managers = accommodation.managers.filter(
        (m) => m.managerId !== userId,
      );
    } else if (role === 'coach') {
      accommodation.coaches = accommodation.coaches.filter(
        (c) => c.coachId !== userId,
      );
    }

    // Update the user
    user.accommodation = null;
    user.bedNumber = null;
    await repository.save(user);

    await this.accommodationRepository.save(accommodation);

    return this.accommodationRepository.findOne({
      where: { accommodationId: accommodation.accommodationId },
      relations: ['athletes', 'managers', 'coaches'],
    });
  }
}
