import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as QRCode from 'qrcode';
import { In, Repository } from 'typeorm';
import { School } from '../school/school.entity';
import { Event } from 'src/event/event.entity';
import { AthleteDto } from './athlete.dto';
import { Athlete } from './athlete.entity';
import { EventGroup } from 'src/event/enums/event-group.enum';
// import { calculateAge } from 'src/shared/utils/date-utils';
import { EventType } from 'src/event/enums/event-type.enum';

@Injectable()
export class AthleteService {
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async createAthlete(athleteDto: AthleteDto): Promise<Athlete> {
    const backendUrl = process.env.BACKEND_URL;

    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: athleteDto.affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Generate chestNumber from aadhaarNumber (last 5 digits)
    const chestNumber = athleteDto.aadhaarNumber.slice(-5);

    // Create the athlete entity
    const athlete = this.athleteRepository.create({
      ...athleteDto,
      chestNumber,
      mealsRemaining: 5,
      school: school,
    });

    // Save the athlete entity without the QR code first
    const savedAthlete = await this.athleteRepository.save(athlete);

    // Generate the QR code using the saved athlete's registration ID
    const qrCodeData = `${backendUrl}/verify-meal?registrationId=${savedAthlete.registrationId}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    // Update the saved athlete with the QR code
    savedAthlete.qrCode = qrCode;

    // Save the athlete entity again with the updated QR code
    await this.athleteRepository.save(savedAthlete);

    return savedAthlete;
  }

  async findAll(): Promise<Athlete[]> {
    return this.athleteRepository.find();
  }

  async findOne(id: string): Promise<Athlete> {
    return this.athleteRepository.findOne({ where: { registrationId: id } });
  }

  async findEligibleEvents(id: string): Promise<Event[]> {
    const athlete = await this.findOne(id);

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }
    // const athleteAge = calculateAge(athlete.dob);

    const athleteGroup = EventGroup.Under19;
    // if (athleteAge > 19) {
    //   throw new BadRequestException('Athlete is not eligible');
    // } else if (athleteAge < 14) {
    //   athleteGroup = EventGroup.Under14;
    // } else if (athleteAge < 17) {
    //   athleteGroup = EventGroup.Under17;
    // } else if (athleteAge < 19) {
    //   athleteGroup = EventGroup.Under19;
    // }

    const events = await this.eventRepository.find({
      where: { group: athleteGroup, gender: athlete.gender },
    });

    return events;
  }

  async updateAthlete(id: string, athleteDto: AthleteDto): Promise<Athlete> {
    const existingAthlete = await this.findOne(id);
    if (!existingAthlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (
      athleteDto.aadhaarNumber &&
      athleteDto.aadhaarNumber !== existingAthlete.aadhaarNumber
    ) {
      existingAthlete.chestNumber = athleteDto.aadhaarNumber.slice(-5);
    }

    Object.assign(existingAthlete, athleteDto);

    if (athleteDto.affiliationNumber) {
      const school = await this.schoolRepository.findOne({
        where: { affiliationNumber: athleteDto.affiliationNumber },
      });

      if (!school) {
        throw new NotFoundException('School not found');
      }

      existingAthlete.school = school;
    }

    return this.athleteRepository.save(existingAthlete);
  }

  async assignEvents(athleteId: string, eventIds: string[]): Promise<Athlete> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: athleteId },
      relations: ['events'],
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (!eventIds || eventIds.length === 0) {
      throw new BadRequestException('No events provided');
    }

    // Fetch the events by their IDs
    const events = await this.eventRepository.findBy({
      eventId: In(eventIds),
    });

    if (events.length !== eventIds.length) {
      throw new NotFoundException('One or more events not found');
    }

    // Separate the current events by type
    const currentIndividualEvents = athlete.events.filter(
      (event) => event.type === EventType.Individual,
    ).length;
    const currentGroupEvents = athlete.events.filter(
      (event) => event.type === EventType.Group,
    ).length;

    // Separate the new events by type
    const newIndividualEvents = events.filter(
      (event) => event.type === EventType.Individual,
    ).length;
    const newGroupEvents = events.filter(
      (event) => event.type === EventType.Group,
    ).length;

    // Check if adding these events would exceed the maximum allowed number of events
    if (currentIndividualEvents + newIndividualEvents > 2) {
      throw new BadRequestException(
        'Athlete cannot be registered for more than 2 individual events.',
      );
    }

    if (currentGroupEvents + newGroupEvents > 2) {
      throw new BadRequestException(
        'Athlete cannot be registered for more than 2 group events.',
      );
    }

    // Add the new events to the athlete's existing events
    athlete.events.push(...events);

    return this.athleteRepository.save(athlete);
  }

  async unassignEvents(
    athleteId: string,
    eventIds: string[],
  ): Promise<Athlete> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: athleteId },
      relations: ['events'],
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Fetch events to ensure all eventIds correspond to existing events
    const events = await this.eventRepository.findBy({
      eventId: In(eventIds),
    });

    if (events.length !== eventIds.length) {
      throw new BadRequestException('One or more events not found');
    }

    // Remove the events that match the eventIds passed
    athlete.events = athlete.events.filter(
      (event) => !eventIds.includes(event.eventId),
    );

    return this.athleteRepository.save(athlete);
  }

  async findAssignedEvents(id: string): Promise<Event[]> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
      relations: ['events'],
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Check if the athlete has no events assigned
    if (!athlete.events || athlete.events.length === 0) {
      throw new NotFoundException('No events assigned to this athlete');
    }

    return athlete.events;
  }

  async deleteAthlete(id: string): Promise<void> {
    await this.athleteRepository.delete(id);
  }
}
