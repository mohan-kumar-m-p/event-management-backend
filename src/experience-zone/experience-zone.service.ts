import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExperienceZone } from './experience-zone.entity';

@Injectable()
export class ExperienceZoneService {
  private logger = new Logger(ExperienceZoneService.name);
  s3Service: any;
  constructor(
    @InjectRepository(ExperienceZone)
    private readonly experienceZoneRepository: Repository<ExperienceZone>,
  ) {}

  async findAll(): Promise<ExperienceZone[]> {
    return this.experienceZoneRepository.find();
  }

  async findOne(id: string): Promise<ExperienceZone> {
    return this.experienceZoneRepository.findOne({ where: { id } });
  }
}
