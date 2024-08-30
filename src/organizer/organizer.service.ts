import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organizer } from './organizer.entity';

@Injectable()
export class OrganizerService {
  constructor(
    @InjectRepository(Organizer)
    private organizerRepository: Repository<Organizer>,
  ) {}

  async getLoginOrganizer(email: string) {
    if (!email) {
      throw new BadRequestException('Please enter a valid email address');
    }
    const organizer = await this.organizerRepository.findOne({
      where: { email },
    });

    return organizer;
  }
}
