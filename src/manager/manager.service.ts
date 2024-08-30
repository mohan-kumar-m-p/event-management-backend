import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../school/school.entity';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { ManagerDto } from './manager.dto';
import { Manager } from './manager.entity';

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

  async deleteManager(id: string): Promise<ApiResponse<any>> {
    try {
      const today: Date = new Date();
      const manager: Manager = await this.findOne(id); // Fetch the manager by ID
      if (!manager) {
        throw new NotFoundException(`Manager with ID ${id} not found`);
      }

      manager.deletedOn = today; // Set the deletedOn property to mark as soft deleted
      await this.managerRepository.save(manager); // Save the updated manager entity

      return ApiResponse.success('Manager deleted successfully'); // Return success response
    } catch (error) {
      if (error.code === '22P02') {
        throw new BadRequestException(
          'Invalid format / syntax for input value',
        );
      }
      throw error; // Rethrow any other errors
    }
  }
}
