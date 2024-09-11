import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Coach } from 'src/coach/coach.entity';
import { Manager } from 'src/manager/manager.entity';
import { Repository } from 'typeorm';
import { TransportDetailsDto } from './dto/transport-details.dto';
import { School } from './school.entity';
import { Event } from '../event/event.entity';
import { S3Service } from '../shared/services/s3.service';

@Injectable()
export class SchoolService {
  private readonly logger = new Logger(SchoolService.name);

  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(): Promise<any[]> {
    const schools = await this.schoolRepository.find();
    if (!schools || schools.length === 0) {
      throw new NotFoundException('No schools found');
    }

    const schoolsWithCounts = await Promise.all(
      schools.map(async (school) => {
        const athleteCount = await this.athleteRepository.count({
          where: { school: { affiliationNumber: school.affiliationNumber } },
        });
        const managerCount = await this.managerRepository.count({
          where: { school: { affiliationNumber: school.affiliationNumber } },
        });
        const coachCount = await this.coachRepository.count({
          where: { school: { affiliationNumber: school.affiliationNumber } },
        });

        return {
          affiliationNumber: school.affiliationNumber,
          name: school.name,
          emailId: school.emailId,
          athleteCount,
          managerCount,
          coachCount,
        };
      }),
    );

    return schoolsWithCounts;
  }

  async findOne(id: string): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    const athleteCount = await this.athleteRepository.count({
      where: { school: { affiliationNumber: school.affiliationNumber } },
    });
    const managerCount = await this.managerRepository.count({
      where: { school: { affiliationNumber: school.affiliationNumber } },
    });
    const coachCount = await this.coachRepository.count({
      where: { school: { affiliationNumber: school.affiliationNumber } },
    });

    const events = await this.eventRepository
      .createQueryBuilder('event')
      .innerJoin('event.athletes', 'athlete')
      .innerJoin('athlete.school', 'school')
      .where('school.affiliationNumber = :id', { id: school.affiliationNumber })
      .getMany();

    const eventCount = events.length;

    return {
      ...school,
      athleteCount,
      managerCount,
      coachCount,
      eventCount,
    };
  }

  async updateTransportDetails(
    id: string,
    transportDetails: TransportDetailsDto,
  ): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    Object.assign(school, transportDetails);
    return this.schoolRepository.save(school);
  }

  async updateAccommodationRequirement(
    id: string,
    accommodationRequired: boolean,
  ): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    school.accommodationRequired = accommodationRequired.toString();
    return this.schoolRepository.save(school);
  }

  async getEventsForSchool(id: string): Promise<Event[]> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
      relations: ['athletes', 'athletes.events'],
    });

    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    const schoolEvents = school.athletes.flatMap((athlete) => athlete.events);
    if (schoolEvents.length === 0) {
      throw new NotFoundException(
        `No events found for school with affiliation number ${id}`,
      );
    }
    return schoolEvents;
  }

  async getCoachesForSchool(id: string): Promise<Coach[]> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
      relations: ['coaches'],
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    if (school.coaches.length === 0) {
      throw new NotFoundException(
        `No coaches found for school with affiliation number ${id}`,
      );
    }

    const result = await Promise.all(
      school.coaches.map(async (coach) => {
        const transformedCoach: Record<string, any> = {
          ...coach,
          affiliationNumber: id,
          schoolName: school.name,
          accommodationId: coach.accommodation?.accommodationId || null,
          accommodationName: coach.accommodation?.name || null,
          blockname: coach.accommodation?.block.name || null,
        };
        if (coach.photoUrl) {
          try {
            const bucketName = process.env.S3_BUCKET_NAME;
            const fileData = await this.s3Service.getFile(
              bucketName,
              coach.photoUrl,
            );
            const base64Image = fileData.Body.toString('base64');
            transformedCoach.photo = `data:${fileData.ContentType};base64,${base64Image}`;
          } catch (error) {
            this.logger.error(
              `Error occurred while retrieving coach's photo from S3: ${error.message}`,
            );
            transformedCoach.photo = null;
          }
        } else {
          transformedCoach.photo = null; // No photoUrl in DB
        }

        delete transformedCoach.school;
        delete transformedCoach.accommodation;

        return transformedCoach;
      }),
    );
    return result as Coach[];
  }

  async getManagersForSchool(id: string): Promise<Manager[]> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
      relations: ['managers'],
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    if (school.managers.length === 0) {
      throw new NotFoundException(
        `No managers found for school with affiliation number ${id}`,
      );
    }

    const result = await Promise.all(
      school.managers.map(async (manager) => {
        const transformedManager: Record<string, any> = {
          ...manager,
          affiliationNumber: id,
          schoolName: school.name,
          accommodationId: manager.accommodation?.accommodationId || null,
          accommodationName: manager.accommodation?.name || null,
          blockname: manager.accommodation?.block.name || null,
        };
        if (manager.photoUrl) {
          try {
            const bucketName = process.env.S3_BUCKET_NAME;
            const fileData = await this.s3Service.getFile(
              bucketName,
              manager.photoUrl,
            );
            const base64Image = fileData.Body.toString('base64');
            transformedManager.photo = `data:${fileData.ContentType};base64,${base64Image}`;
          } catch (error) {
            this.logger.error(
              `Error occurred while retrieving manager's photo from S3: ${error.message}`,
            );
            transformedManager.photo = null;
          }
        } else {
          transformedManager.photo = null; // No photoUrl in DB
        }

        delete transformedManager.school;
        delete transformedManager.accommodation;

        return transformedManager;
      }),
    );
    return result as Manager[];
  }
}
