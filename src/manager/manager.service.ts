import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    await this.managerRepository.save(manager);
    return manager;
  }

  async findAll(): Promise<Manager[]> {
    const managers = await this.managerRepository.find();
    if (!managers) {
      throw new NotFoundException('No managers found');
    }
    return managers;
  }

  async findOne(id: string): Promise<Manager> {
    const manager = await this.managerRepository.findOne({
      where: { managerId: id },
    });
    if (!manager) {
      throw new NotFoundException(`Manager with ID ${id} not found`);
    }
    return manager;
  }

  async updateManager(id: string, managerDto: ManagerDto): Promise<Manager> {
    // Fetch the existing manager from the database
    const existingManager = await this.findOne(id);
    if (!existingManager) {
      throw new NotFoundException(`Manager with ID ${id} not found`);
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

    try {
      return this.managerRepository.save(existingManager);
    } catch (error) {
      throw new BadRequestException('Failed to update athlete');
    }
  }

  async deleteManager(id: string): Promise<void> {
    const result = await this.managerRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Manager with ID ${id} not found`);
    }
  }
}
