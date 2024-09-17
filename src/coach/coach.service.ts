import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from '../school/school.entity';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { S3Service } from '../shared/services/s3.service';
import { Coach } from './coach.entity';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';

@Injectable()
export class CoachService {
  private logger = new Logger(CoachService.name);
  constructor(
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
    @InjectRepository(School) // Inject the SchoolRepository to find the school
    private readonly schoolRepository: Repository<School>,
    private readonly s3Service: S3Service,
  ) {}

  async createCoach(
    coachDto: CreateCoachDto,
    schoolAffiliationNumber: string,
    photo?: Express.Multer.File,
  ): Promise<Coach> {
    await this.checkUniqueConstraints(coachDto.emailId, coachDto.aadhaarNumber);
    const affiliationNumber =
      coachDto.affiliationNumber || schoolAffiliationNumber;

    if (!affiliationNumber) {
      throw new BadRequestException('School affiliation number is required');
    }

    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const phone = `+91${coachDto.phone}`;

    let s3Data = null;
    if (photo) {
      s3Data = await this.s3Service.uploadFile(photo, 'coach');
    }

    const password = `${coachDto.name.slice(0, 5)}${coachDto.dob}`;
    const hashedPassword = await this.hashPassword(password);

    // Prepare the coach entity
    const coach = this.coachRepository.create({
      ...coachDto,
      phone,
      mealsRemaining: 5,
      school: school,
      photoUrl: s3Data?.fileKey || null,
      password: hashedPassword,
    });

    await this.coachRepository.save(coach);
    const result = {
      ...coach,
      affiliationNumber: coach.school.affiliationNumber,
      schoolName: coach.school.name,
      accommodationId: coach.accommodation?.accommodationId || null,
      accommodationName: coach.accommodation?.name || null,
      blockName: coach.accommodation?.block.name || null,
    };
    delete result.school;
    delete result.accommodation;
    delete result.password;
    return result;
  }

  async findAll(): Promise<any[]> {
    const coaches = await this.coachRepository.find({
      relations: ['school', 'accommodation'],
    });
    if (!coaches) {
      throw new NotFoundException('No coaches found');
    }
    const result = await Promise.all(
      coaches.map(async (coach) => {
        const transformedCoach: Record<string, any> = {
          ...coach,
          affiliationNumber: coach.school.affiliationNumber,
          schoolName: coach.school.name,
          accommodationId: coach.accommodation?.accommodationId || null,
          accommodationName: coach.accommodation?.name || null,
          blockName: coach.accommodation?.block.name || null,
        };

        if (coach.photoUrl) {
          try {
            const bucketName = process.env.S3_BUCKET_NAME;
            const fileData = await this.s3Service.getFile(
              bucketName,
              coach.photoUrl,
            );
            const base64Image = fileData.Body.toString('base64');
            transformedCoach.photo = `data:${fileData.ContentType};base64,${base64Image}`;
          } catch (error) {
            this.logger.error(
              `Error occurred while retrieving coach's photo from S3: ${error.message}`,
            );
            transformedCoach.photo = null;
          }
        } else {
          transformedCoach.photo = null; // No photoUrl in DB
        }

        delete transformedCoach.school;
        delete transformedCoach.accommodation;

        return transformedCoach;
      }),
    );
    return result;
  }

  async findOne(id: string): Promise<any> {
    const coach = await this.coachRepository.findOne({
      where: { coachId: id },
      relations: ['school', 'accommodation'],
    });
    if (!coach) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }

    const result: Record<string, any> = {
      ...coach,
      affiliationNumber: coach.school.affiliationNumber,
      schoolName: coach.school.name,
      accommodationId: coach.accommodation?.accommodationId || null,
      accommodationName: coach.accommodation?.name || null,
      blockName: coach.accommodation?.block.name || null,
    };

    if (coach.photoUrl) {
      try {
        const bucketName = process.env.S3_BUCKET_NAME;
        const fileData = await this.s3Service.getFile(
          bucketName,
          coach.photoUrl,
        );
        const base64Image = fileData.Body.toString('base64');
        result.photo = `data:${fileData.ContentType};base64,${base64Image}`;
      } catch (error) {
        this.logger.error(
          `Error occurred while retrieving coach's photo from S3: ${error.message}`,
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

  async findAllBySchool(schoolId: string): Promise<any[]> {
    const coaches = await this.coachRepository.find({
      where: { school: { affiliationNumber: schoolId } },
      relations: ['school', 'accommodation'],
    });
    if (!coaches) {
      throw new NotFoundException('No coaches found');
    }
    const result = await Promise.all(
      coaches.map(async (coach) => {
        const transformedAthlete: Record<string, any> = {
          ...coach,
          affiliationNumber: coach.school.affiliationNumber,
          schoolName: coach.school.name,
          accommodationId: coach.accommodation?.accommodationId || null,
          accommodationName: coach.accommodation?.name || null,
          blockName: coach.accommodation?.block.name || null,
        };

        if (coach.photoUrl) {
          try {
            const bucketName = process.env.S3_BUCKET_NAME;
            const fileData = await this.s3Service.getFile(
              bucketName,
              coach.photoUrl,
            );
            const base64Image = fileData.Body.toString('base64');
            transformedAthlete.photo = `data:${fileData.ContentType};base64,${base64Image}`;
          } catch (error) {
            this.logger.error(
              `Error occurred while retrieving coach's photo from S3: ${error.message}`,
            );
            transformedAthlete.photo = null;
          }
        } else {
          transformedAthlete.photo = null; // No photoUrl in DB
        }

        delete transformedAthlete.school;
        delete transformedAthlete.accommodation;

        return transformedAthlete;
      }),
    );

    return result;
  }

  async updateCoach(
    id: string,
    coachDto: UpdateCoachDto,
    photo?: Express.Multer.File,
  ): Promise<Coach> {
    const existingCoach = await this.findOne(id);
    await this.checkUniqueConstraints(
      coachDto.emailId || existingCoach.emailId,
      coachDto.aadhaarNumber || existingCoach.aadhaarNumber,
      id,
    );
    // Fetch the existing coach from the database
    if (!existingCoach) {
      throw new NotFoundException(`Coach with ID ${id} not found`);
    }

    // Update fields from the DTO
    existingCoach.name = coachDto.name;
    existingCoach.dob = coachDto.dob
      ? new Date(coachDto.dob)
      : existingCoach.dob;
    existingCoach.gender = coachDto.gender;
    existingCoach.aadhaarNumber = coachDto.aadhaarNumber;
    existingCoach.phone = coachDto.phone;
    existingCoach.emailId = coachDto.emailId;

    // Update the school if the affiliationNumber has changed
    if (coachDto?.affiliationNumber) {
      const school = await this.schoolRepository.findOne({
        where: { affiliationNumber: coachDto.affiliationNumber },
      });

      if (!school) {
        throw new NotFoundException('School not found');
      }

      existingCoach.school = school;
    }

    // Handle photo updates
    if (photo) {
      // If the existing coach had a photo, delete the old photo from S3
      if (existingCoach.photoUrl) {
        await this.s3Service.deleteFile(
          process.env.S3_BUCKET_NAME,
          existingCoach.photoUrl,
        );
      }

      // Upload the new photo to S3 and update the photoUrl
      const uploadedFile = await this.s3Service.uploadFile(photo, 'coach');
      existingCoach.photoUrl = uploadedFile.fileKey;
    }

    const result = {
      ...existingCoach,
      affiliationNumber: existingCoach?.school?.affiliationNumber,
      accommodationId: existingCoach.accommodation?.accommodationId || null,
      photoUrl: existingCoach.photoUrl || null,
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

  private async checkUniqueConstraints(
    emailId: string,
    aadhaarNumber?: string,
    excludeId?: string,
  ) {
    const emailExists = await this.coachRepository.findOne({
      where: { emailId },
    });

    if (emailExists && emailExists.coachId !== excludeId) {
      throw new ConflictException({
        message: 'Email ID already exists',
        data: {
          type: 'emailId',
        },
      });
    }

    if (aadhaarNumber) {
      const aadhaarExists = await this.coachRepository.findOne({
        where: { aadhaarNumber },
      });

      if (aadhaarExists && aadhaarExists.coachId !== excludeId) {
        throw new ConflictException({
          message: 'Aadhaar number already exists',
          data: {
            type: 'aadhaarNumber',
          },
        });
      }
    }
  }

  private async hashPassword(password: string): Promise<any> {
    return await bcrypt.hash(password, 10);
  }
}
