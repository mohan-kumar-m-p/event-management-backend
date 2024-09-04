import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../school/school.entity';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';

import { Manager } from './manager.entity';
import { S3Service } from 'src/shared/services/s3.service';

@Injectable()
export class ManagerService {
  private readonly logger = new Logger(ManagerService.name);
  constructor(
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(School) // Inject the SchoolRepository to find the school
    private readonly schoolRepository: Repository<School>,
    private readonly s3Service: S3Service,
  ) {}

  async createManager(
    managerDto: CreateManagerDto,
    schoolAffiliationNumber: string,
    photo?: Express.Multer.File,
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

    let s3Data = null;
    if (photo) {
      s3Data = await this.s3Service.uploadFile(photo, 'manager');
    }
    // Prepare the manager entity
    const manager = this.managerRepository.create({
      ...managerDto,
      mealsRemaining: 5,
      school: school,
      photoUrl: s3Data?.fileKey || null,
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

  async findOne(id: string): Promise<any> {
    const manager = await this.managerRepository.findOne({
      where: { managerId: id },
      relations: ['school', 'accommodation'],
    });
    if (!manager) {
      throw new NotFoundException(`Manager with ID ${id} not found`);
    }
    const result: Record<string, any> = {
      ...manager,
      affiliationNumber: manager.school.affiliationNumber,
      schoolName: manager.school.name,
      accommodationId: manager.accommodation?.accommodationId || null,
      accommodationName: manager.accommodation?.name || null,
      blockName: manager.accommodation?.block.name || null,
    };

    if (manager.photoUrl) {
      try {
        const bucketName = process.env.S3_BUCKET_NAME;
        const fileData = await this.s3Service.getFile(
          bucketName,
          manager.photoUrl,
        );
        const base64Image = fileData.Body.toString('base64');
        result.photo = `data:${fileData.ContentType};base64,${base64Image}`;
      } catch (error) {
        this.logger.error(
          `Error occurred while retrieving manager's photo from S3: ${error.message}`,
        );
        result.photo = null;
      }
    } else {
      result.photo = null; // No photoUrl in DB
    }

    delete result.school;
    delete result.accommodation;
    return result;
  }

  async updateManager(
    id: string,
    managerDto: UpdateManagerDto,
    photo?: Express.Multer.File,
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

    // Handle photo updates
    if (photo) {
      // If the existing manager had a photo, delete the old photo from S3
      if (existingManager.photoUrl) {
        await this.s3Service.deleteFile(
          process.env.S3_BUCKET_NAME,
          existingManager.photoUrl,
        );
      }

      // Upload the new photo to S3 and update the photoUrl
      const uploadedFile = await this.s3Service.uploadFile(photo, 'manager');
      existingManager.photoUrl = uploadedFile.fileKey;
    }

    try {
      // Save the updated manager entity
      return this.managerRepository.save(existingManager);
    } catch (error) {
      throw new BadRequestException('Failed to update manager');
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
