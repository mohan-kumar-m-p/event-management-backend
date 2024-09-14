import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Round } from './round.entity';
import { Round as RoundEnum } from './enums/round.enum';

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

  async markRoundAsComplete(id: string): Promise<Round> {
    const round = await this.roundRepository.findOne({
      where: { roundId: id },
    });

    if (!round) {
      throw new NotFoundException(`No round with ${id} found`);
    }

    round.completed = true;
    await this.roundRepository.save(round);
    return round;
  }

  async getRoundById(id: string): Promise<any> {
    const round = await this.roundRepository.findOne({
      where: { roundId: id },
      relations: ['heats', 'event'],
    });
    if (!round) {
      throw new NotFoundException(`No round with ${id} found`);
    }

    const heats = round.heats
      .map((heat) => ({
        heatName: heat.heatName,
        heatId: heat.heatId,
        athletePlacements: heat.athletePlacements,
      }))
      .sort((a, b) => a.heatName.localeCompare(b.heatName));

    return {
      event: `${round.event.name} ${round.event.category} ${round.event.gender == 'M' ? 'Boys' : 'Girls'}`,
      roundName: round.round,
      time: round.time,
      date: round.date,
      heats,
      roundId: round.roundId,
      eventId: round.event.eventId,
    };
  }

  async findRoundsByType(type: string): Promise<string[]> {
    const rounds = await this.roundRepository.find({
      where: { round: RoundEnum[type] },
    });

    const roundIds = rounds.map((round) => round.roundId);
    return roundIds;
  }
}
