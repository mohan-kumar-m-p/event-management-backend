import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';
import { CoachDto } from './coach.dto';
import { Coach } from './coach.entity';
import { School } from 'src/school/school.entity';

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

    // Generate QR code
    const qrCodeData = `https://your-domain.com/verify-meal?coachId=${coach.coachId}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);
    coach.qrCode = qrCode;

    return this.coachRepository.save(coach);
  }

  async findAll(): Promise<Coach[]> {
    return this.coachRepository.find();
  }

  async findOne(id: string): Promise<Coach> {
    return this.coachRepository.findOne({ where: { coachId: id } });
  }

  async updateCoach(id: string, coachDto: CoachDto): Promise<Coach> {
    // Fetch the existing coach from the database
    const existingCoach = await this.findOne(id);
    if (!existingCoach) {
      throw new NotFoundException('Coach not found');
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

    return this.coachRepository.save(existingCoach);
  }

  async deleteCoach(id: string): Promise<void> {
    await this.coachRepository.delete(id);
  }
}
