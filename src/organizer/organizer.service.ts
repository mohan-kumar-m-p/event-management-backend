import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organizer } from './organizer.entity';
import { Athlete } from 'src/athlete/athlete.entity';
import { MealSummary } from 'src/meal/mealSummary.entity';
import { Coach } from 'src/coach/coach.entity';
import { Manager } from 'src/manager/manager.entity';
import { Event } from '../event/event.entity';
import { School } from 'src/school/school.entity';
import { CulturalProgram } from 'src/cultural-program/cultural-program.entity';

@Injectable()
export class OrganizerService {
  private readonly logger = new Logger(OrganizerService.name);
  constructor(
    @InjectRepository(Organizer)
    private organizerRepository: Repository<Organizer>,
    @InjectRepository(Athlete)
    private athleteRepository: Repository<Athlete>,
    @InjectRepository(Coach)
    private coachRepository: Repository<Coach>,
    @InjectRepository(Manager)
    private managerRepository: Repository<Manager>,
    @InjectRepository(MealSummary)
    private mealSummaryRepository: Repository<MealSummary>,
    @InjectRepository(Event)
    private eventRepository: Repository<Event>,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(CulturalProgram)
    private culturalProgramRepository: Repository<CulturalProgram>,
  ) {}

  async getLoginOrganizer(email: string) {
    if (!email) {
      throw new BadRequestException('Please enter a valid email address');
    }
    const organizer = await this.organizerRepository.findOne({
      where: { email },
    });

    return organizer;
  }

  async getAllMetrics() {
    try {
      const athleteCount = await this.athleteRepository.count();
      const managerCount = await this.managerRepository.count();
      const coachCount = await this.coachRepository.count();
      const schoolCount = await this.schoolRepository.count();
      const eventCount = await this.eventRepository.count();
      const activeEventCount = await this.eventRepository.count({
        where: { completed: false },
      });
      const culturalProgramCount = await this.culturalProgramRepository.count();
      const mealSummary = await this.mealSummaryRepository.find();

      return {
        athleteCount,
        managerCount,
        coachCount,
        schoolCount,
        eventCount,
        activeEventCount,
        culturalProgramCount,
        mealSummary,
      };
    } catch (error) {
      this.logger.error(`Error occurred while fetching metrics: ${error}`);
    }
  }
}
