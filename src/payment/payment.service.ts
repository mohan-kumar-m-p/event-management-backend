import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { School } from '../school/school.entity';
import { PaymentStatus } from './enum/payment-status.enum';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async getPaymentAmount(affiliationNumber: string) {
    try {
      const athleteCount = await this.athleteRepository.count({
        relations: ['school'],
        where: { school: { affiliationNumber: affiliationNumber } },
      });

      const managerCount = await this.managerRepository.count({
        relations: ['school'],
        where: { school: { affiliationNumber: affiliationNumber } },
      });

      const coachCount = await this.coachRepository.count({
        relations: ['school'],
        where: { school: { affiliationNumber: affiliationNumber } },
      });

      const total = athleteCount + managerCount + coachCount;
      const paymentAmount = total * 500 * 5;
      return paymentAmount;
    } catch (error) {
      throw new InternalServerErrorException(
        'An error occurred while calculating payment amount',
      );
    }
  }

  async updatePaymentStatusOrganizer(paymentDto) {
    const { affiliationNumber, status } = paymentDto;

    try {
      if (!affiliationNumber) {
        throw new BadRequestException('Affiliation number must be provided');
      }

      const school = await this.schoolRepository.findOne({
        where: { affiliationNumber },
      });

      if (!school) {
        throw new NotFoundException(
          `School with affiliation number ${affiliationNumber} not found`,
        );
      }

      if (status === 'paid') {
        school.paymentStatus = PaymentStatus.Paid;
        school.isPaid = 'true';
        school.accommodationRequired = 'true'
      } else if (status === 'approvalPending') {
        school.paymentStatus = PaymentStatus.ApprovalPending;
        school.isPaid = 'false';
        school.accommodationRequired = 'false'
      } else {
        throw new BadRequestException('Invalid status');
      }

      await this.schoolRepository.save(school);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update payment status');
    }
  }

  async updatePaymentStatusSchool(affiliationNumber, status) {
    try {
      if (!affiliationNumber) {
        throw new BadRequestException('Affiliation number must be provided');
      }

      const school = await this.schoolRepository.findOne({
        where: { affiliationNumber },
      });

      if (!school) {
        throw new NotFoundException(
          `School with affiliation number ${affiliationNumber} not found`,
        );
      }

      if (status === 'approvalPending') {
        school.paymentStatus = PaymentStatus.ApprovalPending;
      } else throw new BadRequestException('Invalid payment status');

      await this.schoolRepository.save(school);
    } catch (error) {
      throw new InternalServerErrorException('Failed to update payment status');
    }
  }

  async getPaymentDetails() {
    try {
      const schools = await this.schoolRepository.find({
        select: ['affiliationNumber', 'name', 'emailId', 'paymentStatus'],
      });
      const groupedSchools = {
        [PaymentStatus.NotPaid]: [],
        [PaymentStatus.ApprovalPending]: [],
        [PaymentStatus.Paid]: [],
      };
      schools.forEach((school) => {
        groupedSchools[school.paymentStatus].push({
          affiliationNumber: school.affiliationNumber,
          name: school.name,
          emailId: school.emailId,
        });
      });
      return groupedSchools;
    } catch (error) {
      this.logger.error(`Failed to get payment details: ${error.message}`);
      throw new InternalServerErrorException('Failed to get payment details');
    }
  }

  async getSchoolsNotPaid() {
    try {
      const schools = await this.schoolRepository.find({
        where: { paymentStatus: PaymentStatus.NotPaid },
      });
      // Transform the result to apply the @Exclude decorator
      return plainToInstance(School, schools);
    } catch (error) {
      this.logger.error(`Failed to get schools not paid: ${error.message}`);
      throw new InternalServerErrorException('Failed to get schools not paid');
    }
  }

  async getSchoolsApprovalPending() {
    try {
      const schools = await this.schoolRepository.find({
        where: { paymentStatus: PaymentStatus.ApprovalPending },
      });

      // Transform the result to apply the @Exclude decorator
      return plainToInstance(School, schools);
    } catch (error) {
      this.logger.error(
        `Failed to get schools approval pending: ${error.message}`,
      );
      throw new InternalServerErrorException(
        'Failed to get schools approval pending',
      );
    }
  }

  async getSchoolsPaid() {
    try {
      const schools = await this.schoolRepository.find({
        where: { paymentStatus: PaymentStatus.Paid },
      });
      // Transform the result to apply the @Exclude decorator
      return plainToInstance(School, schools);
    } catch (error) {
      this.logger.error(`Failed to get schools paid: ${error.message}`);
      throw new InternalServerErrorException('Failed to get schools paid');
    }
  }
}
