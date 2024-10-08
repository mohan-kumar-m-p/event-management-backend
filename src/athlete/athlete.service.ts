import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { hashPassword } from '../auth/utils/utils';
import { CulturalProgram } from '../cultural-program/cultural-program.entity';
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
    await this.checkUniqueConstraints(
      athleteDto.emailId,
      athleteDto.aadhaarNumber,
    );

    const affiliationNumber =
      athleteDto.affiliationNumber || schoolAffiliationNumber;

    if (!affiliationNumber) {
      throw new BadRequestException('School affiliation number is required');
    }

    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Generate unique chest number
    const chestNumber = await this.generateUniqueChestNumber();

    const phone = `+91${athleteDto.phone}`;

    let s3Data = null;
    if (photo) {
      s3Data = await this.s3Service.uploadFile(photo, 'athlete');
    }

    const passWordNamePart = athleteDto.name.split(' ')[0].slice(0, 5);
    const password = `${passWordNamePart}${athleteDto.dob}`;
    const hashedPassword = await hashPassword(password);

    // Create the athlete entity
    const athlete = this.athleteRepository.create({
      ...athleteDto,
      phone,
      chestNumber,
      mealsRemaining: 5,
      school: school,
      photoUrl: s3Data?.fileKey || null,
      password: hashedPassword,
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
    delete result.password;
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
          blockName: athlete.accommodation?.block?.name || null,
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
        delete transformedAthlete.password;

        return transformedAthlete;
      }),
    );

    return result;
  }

  async findAllBySchool(schoolId: string): Promise<any[]> {
    const athletes = await this.athleteRepository.find({
      where: { school: { affiliationNumber: schoolId } },
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
          blockName: athlete.accommodation?.block?.name || null,
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
        delete transformedAthlete.password;

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
      blockName: athlete.accommodation?.block?.name || null,
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
    delete result.password;
    return result;
  }

  async findEligibleEvents(id: string): Promise<any> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
      relations: ['school'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }
    const athleteAge = calculateAge(athlete.dob);

    let athleteGroup;
    if (athleteAge >= 19) {
      throw new BadRequestException('Athlete is over 19 and is not eligible');
    } else if (athleteAge < 14) {
      athleteGroup = [
        EventCategory.Under14,
        EventCategory.Under17,
        EventCategory.Under19,
      ];
    } else if (athleteAge < 17) {
      athleteGroup = [EventCategory.Under17, EventCategory.Under19];
    } else if (athleteAge < 19) {
      athleteGroup = [EventCategory.Under19];
    }

    const events = await this.eventRepository.find({
      where: {
        category: In(athleteGroup),
        gender: athlete.gender,
        sportGroup: EventSportGroup.Athletics,
      },
    });

    if (!events || events.length === 0) {
      throw new NotFoundException('No events found');
    }

    const schoolAthletes = await this.athleteRepository.find({
      where: {
        school: { affiliationNumber: athlete.school.affiliationNumber },
        registrationId: Not(athlete.registrationId),
      },
      relations: ['events'],
    });

    const availableEvents = events.filter((event) => {
      // Count how many athletes from the same school are registered for this event
      const registeredAthleteCount = schoolAthletes.filter((schoolAthlete) =>
        schoolAthlete.events.some((e) => e.eventId === event.eventId),
      ).length;

      if (event.type === EventType.Individual) {
        // For individual events, exclude if any other athlete from the school is registered
        return registeredAthleteCount === 0;
      } else if (event.type === EventType.Group) {
        // For group events, exclude if 5 or more athletes from the school are already registered
        return registeredAthleteCount < 5;
      }

      // If the event type is neither Individual nor Group (shouldn't happen), exclude it
      return false;
    });

    if (availableEvents.length === 0) {
      throw new NotFoundException('No available events found');
    }

    type GroupedEvents = {
      individual: { [key in EventCategory]?: Event[] };
      group: { [key in EventCategory]?: Event[] };
    };

    // Group events by type and then by category
    const groupedEvents = availableEvents.reduce<GroupedEvents>(
      (acc, event) => {
        const categoryKey = event.category as EventCategory;
        if (event.type === EventType.Individual) {
          if (!acc.individual[categoryKey]) {
            acc.individual[categoryKey] = [];
          }
          acc.individual[categoryKey].push(event);
        } else if (event.type === EventType.Group) {
          if (!acc.group[categoryKey]) {
            acc.group[categoryKey] = [];
          }
          acc.group[categoryKey].push(event);
        }
        return acc;
      },
      { individual: {}, group: {} },
    );

    // Check if both groups have events
    const hasIndividualEvents = Object.values(groupedEvents.individual).some(
      (events) => events.length > 0,
    );
    const hasGroupEvents = Object.values(groupedEvents.group).some(
      (events) => events.length > 0,
    );

    if (!hasIndividualEvents && !hasGroupEvents) {
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
    await this.checkUniqueConstraints(
      athleteDto.emailId || existingAthlete.emailId,
      athleteDto.aadhaarNumber || existingAthlete.aadhaarNumber,
      id,
    );
    if (!existingAthlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }

    if (athleteDto.phone.length === 10) {
      athleteDto.phone = `+91${athleteDto.phone}`;
    }
    // Check for DOB or gender changes
    if (
      (athleteDto.dob && athleteDto.dob !== existingAthlete.dob) ||
      (athleteDto.gender && athleteDto.gender !== existingAthlete.gender)
    ) {
      existingAthlete.events = [];
    }

    Object.assign(existingAthlete, athleteDto);

    if (athleteDto?.affiliationNumber) {
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
      affiliationNumber: existingAthlete?.school?.affiliationNumber,
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

    // Check if all events have the same category
    const categories = new Set(events.map((event) => event.category));
    if (categories.size > 1) {
      throw new BadRequestException(
        'Only events from the same age category can be selected',
      );
    }

    // Check if new events' category matches existing events' category
    if (athlete.events.length > 0) {
      const existingCategory = athlete.events[0].category;
      if (existingCategory !== events[0].category) {
        throw new BadRequestException(
          `New events' age category (${events[0].category}) does not match existing events' age category (${existingCategory})`,
        );
      }
    }

    // const athleteAge = calculateAge(athlete.dob);

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
    let maxIndividualEvents = 0;
    const eventCategory = events[0].category;

    switch (eventCategory) {
      case EventCategory.Under11:
        maxIndividualEvents = 3;
        break;
      case EventCategory.Under14:
        maxIndividualEvents = 4;
        break;
      case EventCategory.Under17:
      case EventCategory.Under19:
        maxIndividualEvents = 5;
        break;
      default:
        throw new BadRequestException('Invalid event category');
    }

    const totalIndividualSwimming =
      currentEvents.swimming.individual + newEvents.swimming.individual;
    if (totalIndividualSwimming > maxIndividualEvents) {
      conflictingEvents.push(
        `Swimmer cannot be registered for more than ${maxIndividualEvents} individual swimming events in their age group. Current: ${currentEvents.swimming.individual}, New: ${newEvents.swimming.individual}, Total: ${totalIndividualSwimming}`,
      );
    }

    if (
      currentEvents.swimming.individual + newEvents.swimming.individual >
      maxIndividualEvents
    ) {
      conflictingEvents.push(
        `Swimmer cannot be registered for more than ${maxIndividualEvents} individual swimming events in their age group.`,
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

  async findAssignedEvents(id: string): Promise<any> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
      relations: ['events', 'culturalPrograms'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }

    // Check if the athlete has no events assigned
    if (
      (!athlete.events || athlete.events.length === 0) &&
      (!athlete.culturalPrograms || athlete.culturalPrograms.length === 0)
    ) {
      throw new NotFoundException(
        'No events or cultural programs assigned to this athlete',
      );
    }

    type GroupedEvents = {
      individual: { [key in EventCategory]?: Event[] };
      group: { [key in EventCategory]?: Event[] };
      cultural: CulturalProgram[];
    };

    // Group events by type and then by category
    const groupedEvents = athlete.events.reduce<GroupedEvents>(
      (acc, event) => {
        const categoryKey = event.category as EventCategory;
        if (event.type === EventType.Individual) {
          if (!acc.individual[categoryKey]) {
            acc.individual[categoryKey] = [];
          }
          acc.individual[categoryKey].push(event);
        } else if (event.type === EventType.Group) {
          if (!acc.group[categoryKey]) {
            acc.group[categoryKey] = [];
          }
          acc.group[categoryKey].push(event);
        }
        return acc;
      },
      { individual: {}, group: {}, cultural: [] },
    );

    // Add cultural programs to the groupedEvents
    groupedEvents.cultural = athlete.culturalPrograms || [];

    // Check if both groups have events
    const hasIndividualEvents = Object.values(groupedEvents.individual).some(
      (events) => events.length > 0,
    );
    const hasGroupEvents = Object.values(groupedEvents.group).some(
      (events) => events.length > 0,
    );

    const hasCulturalPrograms = groupedEvents.cultural.length > 0;

    if (!hasIndividualEvents && !hasGroupEvents && !hasCulturalPrograms) {
      throw new NotFoundException(
        'No events or cultural programs assigned to this athlete',
      );
    }

    try {
      return groupedEvents;
    } catch (error) {
      throw new BadRequestException('Failed to fetch assigned events');
    }
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

  async updateAthleteEvents(
    athleteId: string,
    eventIds: string[],
  ): Promise<Athlete> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: athleteId },
      relations: ['events', 'school'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${athleteId} not found`);
    }

    if (!eventIds || eventIds.length === 0) {
      athlete.events = [];
      return await this.athleteRepository.save(athlete);
    }

    const events = await this.eventRepository.findBy({
      eventId: In(eventIds),
    });

    if (events.length !== eventIds.length) {
      throw new NotFoundException('One or more events not found');
    }

    // Check if all events have the same category and gender
    const categories = new Set(events.map((event) => event.category));
    const genders = new Set(events.map((event) => event.gender));
    if (
      categories.size > 1 ||
      genders.size > 1 ||
      events[0].gender !== athlete.gender
    ) {
      throw new BadRequestException(
        "Events must be from the same category and match the athlete's gender",
      );
    }

    // Check if any event is already assigned to another athlete from the same school
    const schoolAthletes = await this.athleteRepository.find({
      where: {
        school: { affiliationNumber: athlete.school.affiliationNumber },
        registrationId: Not(athleteId),
      },
      relations: ['events'],
    });

    const conflictingEvents = [];

    for (const event of events) {
      if (event.type === EventType.Individual) {
        // Check for individual events
        const isAssigned = schoolAthletes.some((schoolAthlete) =>
          schoolAthlete.events.some((e) => e.eventId === event.eventId),
        );
        if (isAssigned) {
          conflictingEvents.push(
            `${event.name} is already assigned to another athlete from your school`,
          );
        }
      } else if (event.type === EventType.Group) {
        // Check for group events
        const athletesInEvent = schoolAthletes.filter((schoolAthlete) =>
          schoolAthlete.events.some((e) => e.eventId === event.eventId),
        ).length;
        if (athletesInEvent >= 5) {
          conflictingEvents.push(
            `${event.name} already has 5 athletes from your school`,
          );
        }
      }
    }

    if (conflictingEvents.length > 0) {
      throw new BadRequestException({
        message: 'The following events have conflicts:',
        data: conflictingEvents,
      });
    }

    // Check the number of individual events
    const individualEvents = events.filter(
      (event) => event.type === EventType.Individual,
    );
    // Check swimming events
    const maxIndividualEvents = 2;
    // const eventCategory = events[0].category; // All events have the same category as checked earlier

    // switch (eventCategory) {
    //   case EventCategory.Under11:
    //     maxIndividualEvents = 3;
    //     break;
    //   case EventCategory.Under14:
    //     maxIndividualEvents = 4;
    //     break;
    //   case EventCategory.Under17:
    //   case EventCategory.Under19:
    //     maxIndividualEvents = 5;
    //     break;
    //   default:
    //     throw new BadRequestException('Invalid event category');
    // }

    if (individualEvents.length > maxIndividualEvents) {
      throw new BadRequestException(
        `Athletes can only participate in up to ${maxIndividualEvents} individual events`,
      );
    }

    // If all checks pass, update the athlete's events
    athlete.events = events;

    try {
      return await this.athleteRepository.save(athlete);
    } catch (error) {
      throw new BadRequestException('Failed to update athlete events');
    }
  }

  async findPastEvents(id: string): Promise<any> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
      relations: ['events'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }

    const pastEvents = athlete.events.filter((event) => event.completed);
    if (!pastEvents || pastEvents.length === 0) {
      throw new NotFoundException(
        `No past events found for athlete with ID ${id}`,
      );
    }
    // Grouping events by type
    const groupedEvents = pastEvents.reduce(
      (acc, event) => {
        const type = event.type.toLowerCase();
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(event);
        return acc;
      },
      {} as { [key: string]: Event[] },
    );

    return groupedEvents;
  }

  async findUpcomingEvents(id: string): Promise<any> {
    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: id },
      relations: ['events'],
    });

    if (!athlete) {
      throw new NotFoundException(`Athlete with ID ${id} not found`);
    }

    const upcomingEvents = athlete.events.filter((event) => !event.completed);
    if (!upcomingEvents || upcomingEvents.length === 0) {
      throw new NotFoundException(
        `No upcoming events found for athlete with ID ${id}`,
      );
    }
    // Grouping events by type
    const groupedEvents = upcomingEvents.reduce(
      (acc, event) => {
        const type = event.type.toLowerCase();
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(event);
        return acc;
      },
      {} as { [key: string]: Event[] },
    );

    return groupedEvents;
  }

  private async checkUniqueConstraints(
    emailId: string,
    aadhaarNumber?: string,
    excludeId?: string,
  ) {
    const emailExists = await this.athleteRepository.findOne({
      where: { emailId },
    });

    if (emailExists && emailExists.registrationId !== excludeId) {
      throw new ConflictException({
        message: 'Email ID already exists',
        data: {
          type: 'emailId',
        },
      });
    }

    if (aadhaarNumber) {
      const aadhaarExists = await this.athleteRepository.findOne({
        where: { aadhaarNumber },
      });

      if (aadhaarExists && aadhaarExists.registrationId !== excludeId) {
        throw new ConflictException({
          message: 'Aadhaar number already exists',
          data: {
            type: 'aadhaarNumber',
          },
        });
      }
    }
  }

  private async generateUniqueChestNumber(): Promise<string> {
    while (true) {
      // Generate a random 4-digit number
      const chestNumber = Math.floor(1000 + Math.random() * 9000).toString();
      // Check if this chest number already exists
      const existingAthlete = await this.athleteRepository.findOne({
        where: { chestNumber },
      });
      if (!existingAthlete) {
        return chestNumber;
      }
    }
  }
}
