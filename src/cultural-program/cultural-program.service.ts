import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Repository } from 'typeorm';
import { CulturalProgram } from './cultural-program.entity';
import { CulturalProgramDto } from './cultural-program.dto';
import { School } from 'src/school/school.entity';

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
  ): Promise<CulturalProgram> {
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

    // Prepare the cultural program entity
    const culturalProgram = this.culturalProgramRepository.create({
      ...culturalProgramDto,
      athlete: athlete,
      school: school,
      mediaUrl: s3Data?.fileKey || null,
    });

    await this.culturalProgramRepository.save(culturalProgram);
    const result = {
      ...culturalProgram,
      athleteId: culturalProgram.athlete.registrationId,
      athleteName: culturalProgram.athlete.name,
      affiliationNumber: culturalProgram.school.affiliationNumber,
      schoolName: culturalProgram.school.name,
    };
    delete result.athlete;
    delete result.school;
    return result;
  }

  async findAll(): Promise<any[]> {
    const programs = await this.culturalProgramRepository.find({
      relations: ['athlete', 'school'],
    });
    if (!programs) {
      throw new NotFoundException('No cultural programs found');
    }
    const result = programs.map((program) => {
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
}
