import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EventCategory } from '../event/enums/event-category.enum';
import { EventSportGroup } from '../event/enums/event-sport-group.enum';
import { EventType } from '../event/enums/event-type.enum';
import { Event } from '../event/event.entity';
import { Round } from '../round/round.entity';
import { School } from '../school/school.entity';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { S3Service } from '../shared/services/s3.service';
import { calculateAge } from '../shared/utils/date-utils';
import { Athlete } from './athlete.entity';
import { CreateAthleteDto } from './dto/create-athlete.dto';
import { UpdateAthleteDto } from './dto/update-athlete.dto';

@Injectable()
export class AthleteService {
  private readonly logger = new Logger(AthleteService.name);
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    private readonly s3Service: S3Service,
  ) {}

  async createAthlete(
    athleteDto: CreateAthleteDto,
    schoolAffiliationNumber: string,
    photo?: Express.Multer.File,
  ): Promise<Athlete> {
    const affiliationNumber =
      athleteDto.affiliationNumber || schoolAffiliationNumber;

    if (!affiliationNumber) {
      throw new BadRequestException('School affiliation number is required');
    }

    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: athleteDto.affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Generate chestNumber from aadhaarNumber (last 5 digits)
    const chestNumber = athleteDto.aadhaarNumber.slice(-5);

    let s3Data = null;
    if (photo) {
      s3Data = await this.s3Service.uploadFile(photo, 'athlete');
    }

    // Create the athlete entity
    const athlete = this.athleteRepository.create({
      ...athleteDto,
      chestNumber,
      mealsRemaining: 5,
      school: school,
      photoUrl: s3Data?.fileKey || null,
    });

    await this.athleteRepository.save(athlete);
    const result = {
      ...athlete,
      affiliationNumber: athlete.school.affiliationNumber,
      schoolName: athlete.school.name,
      accommodationId: athlete.accommodation?.accommodationId || null,
      accommodationName: athlete.accommodation?.name || null,
      blockName: athlete.accommodation?.block.name || null,
    };
    delete result.school;
    delete result.accommodation;
    return result;
  }

  async findAll(): Promise<any[]> {
    const athletes = await this.athleteRepository.find({
      relations: ['school', 'accommodation'],
    });
    if (!athletes) {
      throw new NotFoundException('No athletes found');
    }
    const result = await Promise.all(
      athletes.map(async (athlete) => {
        const transformedAthlete: Record<string, any> = {
          ...athlete,
          affiliationNumber: athlete.school.affiliationNumber,
          schoolName: athlete.school.name,
          accommodationId: athlete.accommodation?.accommodationId || null,
          accommodationName: athlete.accommodation?.name || null,
          blockName: athlete.accommodation?.block.name || null,
        };

        if (athlete.photoUrl) {
          try {
            const bucketName = process.env.S3_BUCKET_NAME;
            const fileData = await this.s3Service.getFile(
              bucketName,
              athlete.photoUrl,
            );
            const base64Image = fileData.Body.toString('base64');
            transformedAthlete.photo = `data:${fileData.ContentType};base64,${base64Image}`;
          } catch (error) {
            this.logger.error(
              `Error occurred while retrieving athlete's photo from S3: ${error.message}`,
            );
            transformedAthlete.photo = null;
          }
        } else {
          transformedAthlete.photo = null; // No photoUrl in DB
        }

        delete transformedAthlete.school;
        delete transformedAthlete.accommodation;

        return transformedAthlete;
      }),
    );

    return result;
  }

  async findOne(id: string): Promise<any> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
      relations: ['school', 'accommodation'],
    });
    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }
    const result: Record<string, any> = {
      ...athlete,
      affiliationNumber: athlete.school.affiliationNumber,
      schoolName: athlete.school.name,
      accommodationId: athlete.accommodation?.accommodationId || null,
      accommodationName: athlete.accommodation?.name || null,
      blockName: athlete.accommodation?.block.name || null,
    };

    if (athlete.photoUrl) {
      try {
        const bucketName = process.env.S3_BUCKET_NAME;
        const fileData = await this.s3Service.getFile(
          bucketName,
          athlete.photoUrl,
        );
        const base64Image = fileData.Body.toString('base64');
        result.photo = `data:${fileData.ContentType};base64,${base64Image}`;
      } catch (error) {
        this.logger.error(
          `Error occurred while retrieving athlete's photo from S3: ${error.message}`,
        );
        result.photo = null;
      }
    } else {
      result.photo = null; // No photoUrl in DB
    }

    delete result.school;
    delete result.accommodation;
    return result;
  }

  async findEligibleEvents(
    id: string,
  ): Promise<{ individual: Event[]; group: Event[] }> {
    const athlete = await this.findOne(id);

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }
    const athleteAge = calculateAge(athlete.dob);

    let athleteGroup;
    if (athleteAge > 19) {
      throw new BadRequestException('Athlete is not eligible');
    } else if (athleteAge < 11) {
      athleteGroup = EventCategory.Under11;
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
    // Group events by type
    const groupedEvents = events.reduce(
      (acc, event) => {
        if (event.type === EventType.Individual) {
          acc.individual.push(event);
        } else if (event.type === EventType.Group) {
          acc.group.push(event);
        }
        return acc;
      },
      { individual: [], group: [] },
    );

    // Check if both groups have events
    if (
      groupedEvents.individual.length === 0 &&
      groupedEvents.group.length === 0
    ) {
      throw new NotFoundException(
        'No events found for either individual or group categories',
      );
    }

    return groupedEvents;
  }

  async updateAthlete(
    id: string,
    athleteDto: UpdateAthleteDto,
    photo?: Express.Multer.File,
  ): Promise<Athlete> {
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

    // Check for DOB or gender changes
    if (
      (athleteDto.dob && athleteDto.dob !== existingAthlete.dob) ||
      (athleteDto.gender && athleteDto.gender !== existingAthlete.gender)
    ) {
      existingAthlete.events = [];
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

    // Handle photo updates
    if (photo) {
      // If the existing athlete had a photo, delete the old photo from S3
      if (existingAthlete.photoUrl) {
        await this.s3Service.deleteFile(
          process.env.S3_BUCKET_NAME,
          existingAthlete.photoUrl,
        );
      }

      // Upload the new photo to S3 and update the photoUrl
      const uploadedFile = await this.s3Service.uploadFile(photo, 'athlete');
      existingAthlete.photoUrl = uploadedFile.fileKey;
    }

    const result = {
      ...existingAthlete,
      affiliationNumber: existingAthlete.school.affiliationNumber,
      accommodationId: existingAthlete.accommodation?.accommodationId || null,
      photoUrl: existingAthlete.photoUrl,
    };
    delete result.school;
    delete result.accommodation;

    try {
      await this.athleteRepository.save(existingAthlete);
      return result;
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

    // Filter out events that are already assigned to the athlete
    const newEventIds = eventIds.filter(
      (eventId) => !athlete.events.some((event) => event.eventId === eventId),
    );

    if (newEventIds.length === 0) {
      throw new BadRequestException(
        'All provided events are already assigned to the athlete',
      );
    }

    const events = await this.eventRepository.findBy({
      eventId: In(newEventIds),
    });

    if (events.length !== newEventIds.length) {
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

  async getQualifiedAthletesByRound(id: string): Promise<Athlete[]> {
    console.log(`The round Id passed to the service is: ${id}`);
    const round = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });
    const athletes = await this.athleteRepository.find({
      where: { events: { eventId: round.event.eventId } },
    });
    return athletes;
  }

  async deleteAthlete(id: string): Promise<ApiResponse<any>> {
    try {
      const today: Date = new Date();
      const athlete: Athlete = await this.findOne(id); // Fetch the athlete by ID
      if (!athlete) {
        throw new NotFoundException(`Athlete with ID ${id} not found`);
      }

      athlete.deletedOn = today;
      await this.athleteRepository.save(athlete);

      return ApiResponse.success(`Athlete with ID ${id} deleted successfully`);
    } catch (error) {
      if (error.code === '22P02') {
        throw new BadRequestException(
          'Invalid format / syntax for input value',
        );
      }
      throw error; // Rethrow any other errors
    }
  }
}
