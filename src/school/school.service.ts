import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { School } from './school.entity';
import { Athlete } from 'src/athlete/athlete.entity';
import { Manager } from 'src/manager/manager.entity';
import { Coach } from 'src/coach/coach.entity';
import { TransportDetailsDto } from './dto/transport-details.dto';

@Injectable()
export class SchoolService {
  constructor(
    @InjectRepository(School)
    private readonly schoolRepository: Repository<School>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Manager)
    private readonly managerRepository: Repository<Manager>,
    @InjectRepository(Coach)
    private readonly coachRepository: Repository<Coach>,
  ) {}

  async findAll(): Promise<any[]> {
    const schools = await this.schoolRepository.find();
    if (!schools || schools.length === 0) {
      throw new NotFoundException('No schools found');
    }

    const schoolsWithCounts = await Promise.all(
      schools.map(async (school) => {
        const athleteCount = await this.athleteRepository.count({
          where: { school: { affiliationNumber: school.affiliationNumber } },
        });
        const managerCount = await this.managerRepository.count({
          where: { school: { affiliationNumber: school.affiliationNumber } },
        });
        const coachCount = await this.coachRepository.count({
          where: { school: { affiliationNumber: school.affiliationNumber } },
        });

        return {
          ...school,
          athleteCount,
          managerCount,
          coachCount,
        };
      }),
    );

    return schoolsWithCounts;
  }

  async findOne(id: string): Promise<any> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    const athleteCount = await this.athleteRepository.count({
      where: { school: { affiliationNumber: school.affiliationNumber } },
    });
    const managerCount = await this.managerRepository.count({
      where: { school: { affiliationNumber: school.affiliationNumber } },
    });
    const coachCount = await this.coachRepository.count({
      where: { school: { affiliationNumber: school.affiliationNumber } },
    });

    return {
      ...school,
      athleteCount,
      managerCount,
      coachCount,
    };
  }

  async updateTransportDetails(
    id: string,
    transportDetails: TransportDetailsDto,
  ): Promise<School> {
    const school = await this.schoolRepository.findOne({
      where: { affiliationNumber: id },
    });
    if (!school) {
      throw new NotFoundException(`School with ID ${id} not found`);
    }

    Object.assign(school, transportDetails);
    return this.schoolRepository.save(school);
  }
}
