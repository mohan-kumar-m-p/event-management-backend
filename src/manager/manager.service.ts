import { Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { School } from 'src/school/school.entity';
import { ManagerDto } from './manager.dto';
import { Manager } from './manager.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(School) // Inject the SchoolRepository to find the school
    private readonly schoolRepository: Repository<School>,
  ) {}

  async createManager(managerDto: ManagerDto): Promise<Manager> {
    const backendUrl = process.env.BACKEND_URL;

    // Find the school by affiliationNumber
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: managerDto.affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    // Prepare the manager entity
    const manager = this.managerRepository.create({
      ...managerDto,
      mealsRemaining: 5,
      school: school,
    });

    // Generate QR code
    const qrCodeData = `${backendUrl}/verify-meal?managerId=${manager.managerId}`;
    const qrCode = await QRCode.toDataURL(qrCodeData);
    manager.qrCode = qrCode;

    return this.managerRepository.save(manager);
  }

  async findAll(): Promise<Manager[]> {
    return this.managerRepository.find();
  }

  async findOne(id: string): Promise<Manager> {
    return this.managerRepository.findOne({ where: { managerId: id } });
  }

  async updateManager(id: string, managerDto: ManagerDto): Promise<Manager> {
    // Fetch the existing manager from the database
    const existingManager = await this.findOne(id);
    if (!existingManager) {
      throw new NotFoundException('Manager not found');
    }

    // Update fields from the DTO
    existingManager.name = managerDto.name;
    existingManager.dob = managerDto.dob;
    existingManager.gender = managerDto.gender;
    existingManager.aadhaarNumber = managerDto.aadhaarNumber;
    existingManager.phone = managerDto.phone;
    existingManager.emailId = managerDto.emailId;

    // Update the school if the affiliationNumber has changed
    if (managerDto.affiliationNumber) {
      const school = await this.schoolRepository.findOne({
        where: { affiliationNumber: managerDto.affiliationNumber },
      });

      if (!school) {
        throw new NotFoundException('School not found');
      }

      existingManager.school = school;
    }

    return this.managerRepository.save(existingManager);
  }

  async deleteManager(id: string): Promise<void> {
    await this.managerRepository.delete(id);
  }
}
