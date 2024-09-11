import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Round } from './round.entity';

@Injectable()
export class RoundService {
  constructor(
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
  ) {}

  async getQualifiedAthletesByRound(id: string): Promise<Athlete[]> {
    const round = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['event'],
    });
    const athletes = await this.athleteRepository.find({
      where: { events: { eventId: round.event.eventId } },
      relations: ['events'],
    });
    return athletes;
  }
}
