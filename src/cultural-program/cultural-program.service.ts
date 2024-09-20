import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { School } from 'src/school/school.entity';
import { Repository } from 'typeorm';
import { CulturalProgramDto } from './cultural-program.dto';
import { CulturalProgram } from './cultural-program.entity';

@Injectable()
export class CulturalProgramService {
  private logger = new Logger(CulturalProgramService.name);
  s3Service: any;
  constructor(
    @InjectRepository(CulturalProgram)
    private readonly culturalProgramRepository: Repository<CulturalProgram>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async createCulturalProgram(
    culturalProgramDto: CulturalProgramDto,
    schoolAffiliationNumber: string,
    media?: Express.Multer.File,
  ): Promise<CulturalProgram[]> {
    const affiliationNumber =
      culturalProgramDto.affiliationNumber || schoolAffiliationNumber;

    if (!affiliationNumber) {
      throw new BadRequestException('School affiliation number is required');
    }

    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: culturalProgramDto.affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: culturalProgramDto.athleteId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    let s3Data = null;
    if (media) {
      s3Data = await this.s3Service.uploadFile(media, 'cultural-program');
    }

    // Create a cultural program for each category
    const culturalPrograms = await Promise.all(
      culturalProgramDto.category.map(async (category) => {
        const culturalProgram = this.culturalProgramRepository.create({
          ...culturalProgramDto,
          category,
          athlete: athlete,
          school: school,
          mediaUrl: s3Data?.fileKey || null,
        });

        await this.culturalProgramRepository.save(culturalProgram);

        return {
          ...culturalProgram,
          athleteId: culturalProgram.athlete.registrationId,
          athleteName: culturalProgram.athlete.name,
          affiliationNumber: culturalProgram.school.affiliationNumber,
          schoolName: culturalProgram.school.name,
        };
      }),
    );

    // Remove athlete and school from each result
    culturalPrograms.forEach((result) => {
      delete result.athlete;
      delete result.school;
    });

    return culturalPrograms;
  }

  async findAll(): Promise<any[]> {
    const programs = await this.culturalProgramRepository.find({
      relations: ['athlete', 'school'],
    });
    if (!programs) {
      throw new NotFoundException('No cultural programs found');
    }
    const result = programs
      .filter((program) => program.athlete && !program.athlete?.deletedOn)
      .map((program) => {
        const transformedProgram = {
          ...program,
          athleteId: program.athlete.registrationId,
          athleteName: program.athlete.name,
          affiliationNumber: program.school.affiliationNumber,
          schoolName: program.school.name,
        };
        delete transformedProgram.athlete;
        delete transformedProgram.school;
        return transformedProgram;
      });
    return result;
  }

  async findAllByStudent(registrationId: string): Promise<any[]> {
    const programs = await this.culturalProgramRepository.find({
      where: { athlete: { registrationId } },
    });

    if (!programs) {
      throw new NotFoundException(
        `No cultural programs found for student with Id ${registrationId}`,
      );
    }

    return programs;
  }

  async findAllBySchool(affiliationNumber: string): Promise<any[]> {
    const programs = await this.culturalProgramRepository.find({
      where: { school: { affiliationNumber } },
      relations: ['athlete'],
    });

    if (!programs) {
      throw new NotFoundException(
        `No cultural programs found for school with affiliation number ${affiliationNumber}`,
      );
    }

    const result = programs.map((program) => {
      const { athlete, ...programDetails } = program;
      return {
        ...programDetails,
        athleteId: athlete.registrationId,
        athleteName: athlete.name,
        chestNumber: athlete.chestNumber,
      };
    });

    return result;
  }

  async updateCulturalProgram(
    id: string,
    culturalProgramDto: CulturalProgramDto,
    affiliationNumber: string,
    media?: Express.Multer.File,
  ): Promise<any> {
    const existingCulturalProgram =
      await this.culturalProgramRepository.findOne({
        where: { id },
        relations: ['athlete', 'school'],
      });

    if (!existingCulturalProgram) {
      throw new NotFoundException('Cultural program not found');
    }

    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    const athlete = await this.athleteRepository.findOne({
      where: { registrationId: culturalProgramDto.athleteId },
    });

    if (!athlete) {
      throw new NotFoundException('Athlete not found');
    }

    // Handle media file upload if provided
    let s3Data = null;
    if (media) {
      s3Data = await this.s3Service.uploadFile(media, 'cultural-program');
    }

    // Iterate through the categories and update the cultural programs for each category
    const updatedCulturalPrograms = await Promise.all(
      culturalProgramDto.category.map(async (category) => {
        const updatedCulturalProgram = {
          ...existingCulturalProgram, // Start with the existing data
          ...culturalProgramDto, // Override with new DTO data
          category, // Specific category in the current loop iteration
          athlete: athlete, // Updated athlete
          school: school, // Updated school
          mediaUrl:
            s3Data?.fileKey ||
            culturalProgramDto.mediaUrl ||
            existingCulturalProgram.mediaUrl, // Keep existing media URL if not provided
        };

        // Save the updated cultural program
        await this.culturalProgramRepository.save(updatedCulturalProgram);

        // Return the updated program with specific athlete/school details
        return {
          ...updatedCulturalProgram,
          athleteId: updatedCulturalProgram.athlete.registrationId,
          athleteName: updatedCulturalProgram.athlete.name,
          affiliationNumber: updatedCulturalProgram.school.affiliationNumber,
          schoolName: updatedCulturalProgram.school.name,
        };
      }),
    );

    // Remove the athlete and school relations from the return objects
    updatedCulturalPrograms.forEach((result) => {
      delete result.athlete;
      delete result.school;
    });

    return updatedCulturalPrograms;
  }
}
