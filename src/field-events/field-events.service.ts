import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Athlete } from 'src/athlete/athlete.entity';
import { Repository } from 'typeorm';
import { Event } from '../event/event.entity';
import { CreateHighJumpRoundDto } from './dtos/highJump.dto';
import { FieldEvents } from './entities/field-events.entity';
import { HighJump } from './entities/high-jump.entity';

@Injectable()
export class FieldEventsService {
  private logger = new Logger(FieldEventsService.name);

  constructor(
    @InjectRepository(FieldEvents)
    private readonly fieldEventsRepository: Repository<FieldEvents>,
    @InjectRepository(HighJump)
    private readonly highJumpRepository: Repository<HighJump>,
    @InjectRepository(Athlete)
    private readonly athleteRepository: Repository<Athlete>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  // Save method (sets submitted to false but respects existing 'submitted' records)
  async saveHighJumpScore(
    createHighJumpDto: CreateHighJumpRoundDto,
    eventId: string,
    roundNumber: string,
  ) {
    try {
      const result = [];
      for (const entry of createHighJumpDto.athleteDetails) {
        const { registrationId, scores } = entry;
        const existingRecord = await this.highJumpRepository.findOne({
          where: { registrationId, eventId },
        });
        if (!existingRecord) {
          const highJump = new HighJump();
          highJump.registrationId = registrationId;
          highJump.eventId = eventId;
          highJump.score = {
            [`round${roundNumber}`]: {
              scores,
              qualified: entry.qualified,
              submitted: entry.submitted ?? false,
              bestScore: Math.max(...scores),
            },
          };
          result.push(highJump);
        } else {
          if (
            existingRecord.score[`round${roundNumber}`].submitted &&
            existingRecord.score[`round${roundNumber}`].qualified !==
              entry.qualified
          ) {
            throw new BadRequestException(
              `Cannot change qualified status for ${`round${roundNumber}`} for registrationId ${existingRecord.registrationId}`,
            );
          }

          existingRecord.score[`round${roundNumber}`].scores = scores;
          existingRecord.score[`round${roundNumber}`].qualified =
            entry.qualified;
          existingRecord.score[`round${roundNumber}`].submitted =
            existingRecord.score[`round${roundNumber}`].submitted ?? false;
          existingRecord.score[`round${roundNumber}`].bestScore = Math.max(
            ...scores,
          );
          result.push(existingRecord);
        }
      }
      await this.highJumpRepository.save(result);
    } catch (error) {
      this.logger.error(`Error while saving high jump score: ${error}`);
      throw error;
    }
  }

  // Submit method (sets submitted to true but respects existing 'submitted' records)
  async submitHighJumpScore(
    createHighJumpDto: CreateHighJumpRoundDto,
    eventId: string,
    roundNumber: string,
  ) {
    try {
      const result = [];
      for (const entry of createHighJumpDto.athleteDetails) {
        const { registrationId, scores } = entry;
        const existingRecord = await this.highJumpRepository.findOne({
          where: { registrationId, eventId },
        });
        if (!existingRecord) {
          const highJump = new HighJump();
          highJump.registrationId = registrationId;
          highJump.eventId = eventId;
          highJump.score = {
            [`round${roundNumber}`]: {
              scores,
              qualified: entry.qualified,
              submitted: true,
              bestScore: Math.max(...scores),
            },
          };
          result.push(highJump);
        } else {
          if (
            existingRecord.score[`round${roundNumber}`].submitted &&
            existingRecord.score[`round${roundNumber}`].qualified !==
              entry.qualified
          ) {
            throw new BadRequestException(
              `Cannot change qualified status for ${`round${roundNumber}`} for registrationId ${existingRecord.registrationId}`,
            );
          }

          existingRecord.score[`round${roundNumber}`].scores = scores;
          existingRecord.score[`round${roundNumber}`].qualified =
            entry.qualified;
          existingRecord.score[`round${roundNumber}`].submitted = true;
          existingRecord.score[`round${roundNumber}`].bestScore = Math.max(
            ...scores,
          );
          result.push(existingRecord);
        }
      }
      await this.highJumpRepository.save(result);
    } catch (error) {
      this.logger.error(`Error while submitting high jump score: ${error}`);
      throw error;
    }
  }

  async createHighJumpRound(eventId, round) {
    const roundNumber = parseInt(round);
    if (roundNumber < 1) {
      throw new BadRequestException(
        `Round number must be greater than or equal to 1`,
      );
    }

    if (roundNumber === 1) {
      const event = await this.eventRepository.findOne({
        where: { eventId },
        relations: ['athletes'],
      });
      const athletes = event.athletes;
      if (athletes.length < 1) {
        throw new NotFoundException(
          `No athletes found for event with ID ${eventId}`,
        );
      }
      const filteredAthletes = athletes.map((athlete) => {
        return {
          registrationId: athlete.registrationId,
          name: athlete.name,
          chestNumber: athlete.chestNumber,
        };
      });

      return {
        eventId: eventId,
        athletes: filteredAthletes,
      };
    }

    const previousRound = `round${roundNumber - 1}`;
    const highJumps = await this.highJumpRepository.find({
      where: { eventId },
    });
    const filteredHighJumps = highJumps.filter((highJump) => {
      const score = highJump.score;
      return score[previousRound] && score[previousRound].qualified === true;
    });
    for (const highJump of filteredHighJumps) {
      const athlete = await this.athleteRepository.findOne({
        where: { registrationId: highJump.registrationId },
      });
      if (!athlete) {
        throw new NotFoundException(
          `Athlete with registrationID ${highJump.registrationId} not found`,
        );
      }
      highJump['athleteName'] = athlete.name;
      highJump['chestNumber'] = athlete.chestNumber;
    }
    return filteredHighJumps;
  }

  async getHighJumpsByEvent(eventId: string) {
    const highJumps = await this.highJumpRepository.find({
      where: { eventId },
    });
    return highJumps;
  }
}
