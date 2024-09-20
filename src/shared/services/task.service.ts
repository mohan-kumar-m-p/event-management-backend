import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { HeatService } from 'src/heat/heat.service';
import { RoundService } from 'src/round/round.service';
import { MoreThanOrEqual, Repository } from 'typeorm';
import { Athlete } from '../../athlete/athlete.entity';
import { Coach } from '../../coach/coach.entity';
import { Manager } from '../../manager/manager.entity';
import { MealSummary } from '../../meal/mealSummary.entity';
import { School } from '../../school/school.entity';

@Injectable()
export class TaskService {
  private logger = new Logger(TaskService.name);
  roundService: RoundService;
  heatService: HeatService;

  constructor(
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(MealSummary)
    private readonly mealSummaryRepository: Repository<MealSummary>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Kolkata' })
  async resetMeals() {
    await this.athleteRepository.update({}, { mealsRemaining: 5 });
    await this.coachRepository.update({}, { mealsRemaining: 5 });
    await this.managerRepository.update({}, { mealsRemaining: 5 });

    this.logger.log('Meals reset successfully');
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Kolkata' })
  async resetTotalMeals() {
    const eligibleSchools = await this.schoolRepository.find({
      where: { isPaid: 'true' },
    });
    if (eligibleSchools.length === 0) {
      return;
    }

    let totalCount = 0;
    for (const school of eligibleSchools) {
      const athleteCount = await this.athleteRepository.count({
        where: { school: { affiliationNumber: school.affiliationNumber } },
      });

      const managerCount = await this.managerRepository.count({
        where: { school: { affiliationNumber: school.affiliationNumber } },
      });

      const coachCount = await this.coachRepository.count({
        where: { school: { affiliationNumber: school.affiliationNumber } },
      });

      totalCount += athleteCount + managerCount + coachCount;
    }

    const totalMealsPerDay = totalCount * 5;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureMealSummaries = await this.mealSummaryRepository.find({
      where: {
        date: MoreThanOrEqual(today), // Use MoreThanOrEqual operator for future dates
      },
    });

    // Update each future meal summary with the new totalMeals value
    for (const mealSummary of futureMealSummaries) {
      mealSummary.totalMeals = totalMealsPerDay;
      await this.mealSummaryRepository.save(mealSummary);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'Asia/Kolkata' })
  async handleCron() {
    // Get today's date in UTC
    const today = new Date();

    // Convert UTC to IST by adding 5.5 hours (19800 seconds)
    const ISTOffset = 5.5 * 60 * 60 * 1000; // Offset in milliseconds
    const todayIST = new Date(today.getTime() + ISTOffset);

    // Hardcode the target date (September 26th, 2024)
    const targetDate = new Date(2024, 8, 26); // September is month 8 (0-indexed)

    if (
      todayIST.getFullYear() === targetDate.getFullYear() &&
      todayIST.getMonth() === targetDate.getMonth() &&
      todayIST.getDate() === targetDate.getDate()
    ) {
      this.logger.log(
        'Running GenerateQualifyingHeats for all track event rounds labeled "Heats"',
      );
      await this.generateQualifyingHeatsForHeatsRounds();
    }
  }

  private async generateQualifyingHeatsForHeatsRounds() {
    // Fetch all track event rounds labeled "Heats"
    const heatsRounds = await this.roundService.findRoundsByType('Heats');

    for (const round of heatsRounds) {
      await this.heatService.generateQualifierHeats(round);
    }
  }
}
