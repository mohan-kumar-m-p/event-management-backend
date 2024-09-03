import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../school/school.entity';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

import { Manager } from './manager.entity';

@Injectable()
export class ManagerService {
  constructor(
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(School) // Inject the SchoolRepository to find the school
    private readonly schoolRepository: Repository<School>,
  ) {}

  async createManager(
    managerDto: CreateManagerDto,
    schoolAffiliationNumber: string,
  ): Promise<Manager> {
    const affiliationNumber =
      managerDto.affiliationNumber || schoolAffiliationNumber;

    if (!affiliationNumber) {
      throw new BadRequestException('School affiliation number is required');
    }

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
    const result = {
      ...manager,
      affiliationNumber: manager.school.affiliationNumber,
      schoolName: manager.school.name,
      accommodationId: manager.accommodation?.accommodationId || null,
      accommodationName: manager.accommodation?.name || null,
      blockName: manager.accommodation?.block.name || null,
    };
    delete result.school;
    delete result.accommodation;
    return result;
  }

  async findAll(): Promise<Manager[]> {
    const managers = await this.managerRepository.find();
    if (!managers) {
      throw new NotFoundException('No managers found');
    }
    const result = managers.map((manager) => {
      const transformedManager = {
        ...manager,
        affiliationNumber: manager.school.affiliationNumber,
        schoolName: manager.school.name,
        accommodationId: manager.accommodation?.accommodationId || null,
        accommodationName: manager.accommodation?.name || null,
        blockName: manager.accommodation?.block.name || null,
      };
      delete transformedManager.school;
      delete transformedManager.accommodation;
      return transformedManager;
    });
    return result;
  }

  async findOne(id: string): Promise<Manager> {
    const manager = await this.managerRepository.findOne({
      where: { managerId: id },
    });
    if (!manager) {
      throw new NotFoundException(`Manager with ID ${id} not found`);
    }
    const result = {
      ...manager,
      affiliationNumber: manager.school.affiliationNumber,
      schoolName: manager.school.name,
      accommodationId: manager.accommodation?.accommodationId || null,
      accommodationName: manager.accommodation?.name || null,
      blockName: manager.accommodation?.block.name || null,
    };
    delete result.school;
    delete result.accommodation;
    return result;
  }

  async updateManager(
    id: string,
    managerDto: UpdateManagerDto,
  ): Promise<Manager> {
    // Fetch the existing manager from the database
    const existingManager = await this.findOne(id);
    if (!existingManager) {
      throw new NotFoundException(`Manager with ID ${id} not found`);
    }

    // Update fields from the DTO
    existingManager.name = managerDto.name;
    existingManager.dob = managerDto.dob
      ? new Date(managerDto.dob)
      : existingManager.dob;
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
