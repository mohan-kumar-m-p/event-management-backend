import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { School } from 'src/school/school.entity';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { Repository } from 'typeorm';
import { CoachDto } from './coach.dto';
import { Coach } from './coach.entity';

@Injectable()
export class CoachService {
  constructor(
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(School) // Inject the SchoolRepository to find the school
    private readonly schoolRepository: Repository<School>,
  ) {}

  async createCoach(coachDto: CoachDto): Promise<Coach> {
    // Find the school by affiliationNumber
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

    // Save the coach entity without the QR code first
    await this.coachRepository.save(coach);
    return coach;
  }

  async findAll(): Promise<Coach[]> {
    const coaches = await this.coachRepository.find();
    if (!coaches) {
      throw new NotFoundException('No coaches found');
    }
    return coaches;
  }

  async findOne(id: string): Promise<Coach> {
    const coach = await this.coachRepository.findOne({
      where: { coachId: id },
    });
    if (!coach) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }
    return coach;
  }

  async updateCoach(id: string, coachDto: CoachDto): Promise<Coach> {
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

    try {
      return this.coachRepository.save(existingCoach);
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
      return ApiResponse.success('Coach deleted successfully');
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
