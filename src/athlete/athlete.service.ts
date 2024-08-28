import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventCategory } from 'src/event/enums/event-category.enum';
import { EventSportGroup } from 'src/event/enums/event-sport-group.enum';
import { EventType } from 'src/event/enums/event-type.enum';
import { Event } from 'src/event/event.entity';
import { calculateAge } from 'src/shared/utils/date-utils';
import { In, Repository } from 'typeorm';
import { School } from '../school/school.entity';
import { AthleteDto } from './athlete.dto';
import { Athlete } from './athlete.entity';

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

    await this.athleteRepository.save(athlete);
    return athlete;
  }

  async findAll(): Promise<Athlete[]> {
    const athletes = await this.athleteRepository.find();
    if (!athletes) {
      throw new NotFoundException('No athletes found');
    }
    return athletes;
  }

  async findOne(id: string): Promise<Athlete> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
    });
    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }
    return athlete;
  }

  async findEligibleEvents(id: string): Promise<Event[]> {
    const athlete = await this.findOne(id);

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }
    const athleteAge = calculateAge(athlete.dob);

    let athleteGroup;
    if (athleteAge > 19) {
      throw new BadRequestException('Athlete is not eligible');
    } else if (athleteAge < 14) {
      athleteGroup = EventCategory.Under14;
    } else if (athleteAge < 17) {
      athleteGroup = EventCategory.Under17;
    } else if (athleteAge < 19) {
      athleteGroup = EventCategory.Under19;
    }

    const events = await this.eventRepository.find({
      where: { category: athleteGroup, gender: athlete.gender },
    });
    if (!events || events.length === 0) {
      throw new NotFoundException('No events found');
    }
    return events;
  }

  async updateAthlete(id: string, athleteDto: AthleteDto): Promise<Athlete> {
    const existingAthlete = await this.findOne(id);
    if (!existingAthlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
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

    try {
      return await this.athleteRepository.save(existingAthlete);
    } catch (error) {
      throw new BadRequestException('Failed to update athlete');
    }
  }

  async assignEvents(athleteId: string, eventIds: string[]): Promise<Athlete> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: athleteId },
      relations: ['events', 'school'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${athleteId} not found`);
    }

    if (!eventIds || eventIds.length === 0) {
      throw new BadRequestException('No events provided');
    }

    const events = await this.eventRepository.findByIds(eventIds);

    if (events.length !== eventIds.length) {
      throw new NotFoundException('One or more events not found');
    }

    const athleteAge = calculateAge(athlete.dob);

    // Fetch all athletes from the same school
    const schoolAthletes = await this.athleteRepository.find({
      where: {
        school: { affiliationNumber: athlete.school.affiliationNumber },
      },
      relations: ['events'],
    });

    const conflictingEvents = [];

    // Separate current events by type and sport group
    const currentEvents = {
      athletics: {
        individual: athlete.events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Athletics &&
            e.type === EventType.Individual,
        ).length,
        group: athlete.events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Athletics &&
            e.type === EventType.Group,
        ).length,
      },
      swimming: {
        individual: athlete.events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Swimming &&
            e.type === EventType.Individual,
        ).length,
        relay: athlete.events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Swimming &&
            e.type === EventType.Group,
        ).length,
      },
    };

    // Separate new events by type and sport group
    const newEvents = {
      athletics: {
        individual: events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Athletics &&
            e.type === EventType.Individual,
        ).length,
        group: events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Athletics &&
            e.type === EventType.Group,
        ).length,
      },
      swimming: {
        individual: events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Swimming &&
            e.type === EventType.Individual,
        ).length,
        relay: events.filter(
          (e) =>
            e.sportGroup === EventSportGroup.Swimming &&
            e.type === EventType.Group,
        ).length,
      },
    };

    for (const event of events) {
      // Check if the event is already assigned to another athlete from the same school
      const isEventAssigned = schoolAthletes.some(
        (schoolAthlete) =>
          schoolAthlete.registrationId !== athlete.registrationId &&
          schoolAthlete.events.some((e) => e.eventId === event.eventId),
      );

      if (isEventAssigned && event.type !== EventType.Group) {
        conflictingEvents.push(
          `${event.name} is already assigned to another athlete from the same school`,
        );
      }

      if (event.type === EventType.Group) {
        // For relay events, count how many athletes from the school are already registered
        const relayAthleteCount = schoolAthletes.filter((schoolAthlete) =>
          schoolAthlete.events.some((e) => e.eventId === event.eventId),
        ).length;

        if (relayAthleteCount >= 5) {
          conflictingEvents.push(
            `Maximum of 5 athletes from the same school can be registered for relay event ${event.name}`,
          );
        }
      }
    }

    // Check athletics events
    if (
      currentEvents.athletics.individual + newEvents.athletics.individual >
      2
    ) {
      conflictingEvents.push(
        'Athlete cannot be registered for more than 2 individual athletics events.',
      );
    }
    if (currentEvents.athletics.group + newEvents.athletics.group > 2) {
      conflictingEvents.push(
        'Athlete cannot be registered for more than 2 group athletics events.',
      );
    }

    // Check swimming events
    let maxSwimmingEvents = 0;
    if (athleteAge < 11) {
      maxSwimmingEvents = 3;
    } else if (athleteAge < 14) {
      maxSwimmingEvents = 4;
    } else {
      maxSwimmingEvents = 5;
    }

    if (
      currentEvents.swimming.individual + newEvents.swimming.individual >
      maxSwimmingEvents
    ) {
      conflictingEvents.push(
        `Swimmer cannot be registered for more than ${maxSwimmingEvents} individual swimming events in their age group.`,
      );
    }

    if (conflictingEvents.length > 0) {
      throw new BadRequestException({
        message: 'Failed to assign events due to conflicts',
        data: conflictingEvents,
      });
    }

    // If no conflicts, add the new events to the athlete's existing events
    athlete.events.push(...events);

    try {
      return this.athleteRepository.save(athlete);
    } catch (error) {
      throw new BadRequestException('Failed to assign events to athlete');
    }
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
      throw new NotFoundException(`Athlete with ID ${athleteId} not found`);
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

    try {
      return this.athleteRepository.save(athlete);
    } catch (error) {
      throw new BadRequestException('Failed to unassign events');
    }
  }

  async findAssignedEvents(id: string): Promise<Event[]> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
      relations: ['events'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }

    // Check if the athlete has no events assigned
    if (!athlete.events || athlete.events.length === 0) {
      throw new NotFoundException('No events assigned to this athlete');
    }

    try {
      return athlete.events;
    } catch (error) {
      throw new BadRequestException('Failed to unassign events');
    }
  }

  async deleteAthlete(id: string): Promise<void> {
    const result = await this.athleteRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }
  }
}
