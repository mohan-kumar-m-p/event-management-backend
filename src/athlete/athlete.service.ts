import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../school/school.entity';
import { AthleteDto } from './athlete.dto';
import { Athlete } from './athlete.entity';
import * as QRCode from 'qrcode';

@Injectable()
export class AthleteService {
  constructor(
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async createAthlete(athleteDto: AthleteDto): Promise<Athlete> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: athleteDto.affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const chestNumber = athleteDto.aadhaarNumber.slice(-5);

    const athlete = this.athleteRepository.create({
      ...athleteDto,
      chestNumber,
      mealsRemaining: 5,
      school: school,
    });

    const qrCodeData = `https://event-management-backend-dev.vercel.app/verify-meal?registrationId=${athlete.registrationId}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);
    athlete.qrCode = qrCode;

    return this.athleteRepository.save(athlete);
  }

  async findAll(): Promise<Athlete[]> {
    return this.athleteRepository.find();
  }

  async findOne(id: string): Promise<Athlete> {
    return this.athleteRepository.findOne({ where: { registrationId: id } });
  }

  async updateAthlete(id: string, athleteDto: AthleteDto): Promise<Athlete> {
    const existingAthlete = await this.findOne(id);
    if (!existingAthlete) {
      throw new NotFoundException('Athlete not found');
    }

    if (
      athleteDto.aadhaarNumber &&
      athleteDto.aadhaarNumber !== existingAthlete.aadhaarNumber
    ) {
      existingAthlete.chestNumber = athleteDto.aadhaarNumber.slice(-5);
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

    return this.athleteRepository.save(existingAthlete);
  }

  async deleteAthlete(id: string): Promise<void> {
    await this.athleteRepository.delete(id);
  }
}
