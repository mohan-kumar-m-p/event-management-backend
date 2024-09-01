import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { School } from 'src/school/school.entity';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { Repository } from 'typeorm';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { Coach } from './coach.entity';

@Injectable()
export class CoachService {
  constructor(
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(School) // Inject the SchoolRepository to find the school
    private readonly schoolRepository: Repository<School>,
  ) {}

  async createCoach(
    coachDto: CreateCoachDto,
    schoolAffiliationNumber: string,
  ): Promise<Coach> {
    const affiliationNumber =
      coachDto.affiliationNumber || schoolAffiliationNumber;

    if (!affiliationNumber) {
      throw new BadRequestException('School affiliation number is required');
    }

    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: coachDto.affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Prepare the coach entity
    const coach = this.coachRepository.create({
      ...coachDto,
      mealsRemaining: 5,
      school: school,
    });

    await this.coachRepository.save(coach);
    const result = {
      ...coach,
      affiliationNumber: coach.school.affiliationNumber,
      accommodationId: coach.accommodation?.accommodationId || null,
    };
    delete result.school;
    delete result.accommodation;
    return result;
  }

  async findAll(): Promise<Coach[]> {
    const coaches = await this.coachRepository.find({
      relations: ['school', 'accommodation'],
    });
    if (!coaches) {
      throw new NotFoundException('No coaches found');
    }
    const result = coaches.map((coach) => {
      const transformedCoach = {
        ...coach,
        affiliationNumber: coach.school.affiliationNumber,
        accommodationId: coach.accommodation?.accommodationId || null,
      };
      delete transformedCoach.school;
      delete transformedCoach.accommodation;
      return transformedCoach;
    });
    return result;
  }

  async findOne(id: string): Promise<Coach> {
    const coach = await this.coachRepository.findOne({
      where: { coachId: id },
      relations: ['school', 'accommodation'],
    });
    if (!coach) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }

    const result = {
      ...coach,
      affiliationNumber: coach.school.affiliationNumber,
      accommodationId: coach.accommodation?.accommodationId || null,
    };

    delete result.school;
    delete result.accommodation;
    return result;
  }

  async updateCoach(id: string, coachDto: UpdateCoachDto): Promise<Coach> {
    // Fetch the existing coach from the database
    const existingCoach = await this.findOne(id);
    if (!existingCoach) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }

    // Update fields from the DTO
    existingCoach.name = coachDto.name;
    existingCoach.dob = coachDto.dob;
    existingCoach.gender = coachDto.gender;
    existingCoach.aadhaarNumber = coachDto.aadhaarNumber;
    existingCoach.phone = coachDto.phone;
    existingCoach.emailId = coachDto.emailId;

    // Update the school if the affiliationNumber has changed
    if (coachDto.affiliationNumber) {
      const school = await this.schoolRepository.findOne({
        where: { affiliationNumber: coachDto.affiliationNumber },
      });

      if (!school) {
        throw new NotFoundException('School not found');
      }

      existingCoach.school = school;
    }
    const result = {
      ...existingCoach,
      affiliationNumber: existingCoach.school.affiliationNumber,
      accommodationId: existingCoach.accommodation?.accommodationId || null,
    };
    delete result.school;
    delete result.accommodation;

    try {
      await this.coachRepository.save(existingCoach);
      return result;
    } catch (error) {
      throw new BadRequestException('Failed to update coach');
    }
  }

  async deleteCoach(id: string): Promise<ApiResponse<any>> {
    try {
      const today: Date = new Date();
      const coach: Coach = await this.findOne(id); // Fetch the coach by ID
      if (!coach) {
        throw new NotFoundException(`Coach with ID ${id} not found`);
      }

      coach.deletedOn = today;
      await this.coachRepository.save(coach);
      return ApiResponse.success(`Coach with ID ${id} deleted successfully`);
    } catch (error) {
      if (error.code === '22P02') {
        throw new BadRequestException(
          'Invalid format / syntax for input value',
        );
      }
      throw error;
    }
  }
}
