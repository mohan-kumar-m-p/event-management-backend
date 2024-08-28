import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
  ) {}

  async findAll(): Promise<School[]> {
    const schools = await this.schoolRepository.find();
    if (!schools) {
      throw new NotFoundException('No schools found');
    }
    return schools;
  }

  async findOne(id: string): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }
    return school;
  }
}
