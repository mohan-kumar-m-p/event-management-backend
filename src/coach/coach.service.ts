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
    const backendUrl = process.env.BACKEND_URL;
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
    const savedCoach = await this.coachRepository.save(coach);

    // Generate the QR code using the saved coach's registration ID
    const qrCodeData = `${backendUrl}/verify-meal?registrationId=${savedCoach.coachId}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);

    // Update the saved coach with the QR code
    savedCoach.qrCode = qrCode;

    // Save the coach entity again with the updated QR code
    await this.coachRepository.save(savedCoach);

    return savedCoach;
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
