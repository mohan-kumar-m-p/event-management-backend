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
import { filter } from 'rxjs';

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
      const result = []
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
              submitted: entry.submitted || false,
              bestScore: Math.max(...scores),
            },
          };
          result.push(highJump)
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
            entry.submitted;
          existingRecord.score[`round${roundNumber}`].bestScore = Math.max(
            ...scores,
          );
          result.push(existingRecord)
        }
      }
      await this.highJumpRepository.save(result);

    } catch (error) {
      this.logger.error(`Error saving high jump score: ${error}`);
      throw error;
    }

    // else {
    //   await this.updateExistingRecord(existingRecord, score, false); // Don't change submitted, throw error if qualified changes
    // }
    //   }
    // } catch (error) {
    //   this.logger.error(`Error saving high jump score: ${error}`);
    //   throw error;
    // }
  }

  // Submit method (sets submitted to true but respects existing 'submitted' records)
  async submitHighJumpScore(createHighJumpRoundDto: CreateHighJumpRoundDto) {
    // try {
    //   for (const entry of createHighJumpRoundDto) {
    //     const { registrationId, eventId, score } = entry;
    //     const existingRecord = await this.highJumpRepository.findOne({
    //       where: { registrationId, eventId },
    //     });
    //     if (!existingRecord) {
    //       await this.saveNewRecord(entry, true); // Set submitted to true
    //     } else {
    //       await this.updateExistingRecord(existingRecord, score, true); // Check qualified, set submitted to true
    //     }
    //   }
    // } catch (error) {
    //   this.logger.error(`Error submitting high jump score: ${error}`);
    //   throw error;
    // }
  }

  // Helper function to save new record
  private async saveNewRecord(entry: any, isSubmitted: boolean): Promise<void> {
    const { registrationId, eventId, score } = entry;

    // Iterate over rounds and add the bestScore and submitted fields
    for (const roundKey in score) {
      if (score[roundKey].scores.length > 0) {
        score[roundKey].bestScore = Math.max(...score[roundKey].scores);
      } else {
        score[roundKey].bestScore = null; // Handle empty scores
      }
      // Set the submitted field based on the method called
      score[roundKey].submitted = isSubmitted;
    }

    const newRecord = this.highJumpRepository.create({
      registrationId,
      eventId,
      score,
    });

    await this.highJumpRepository.save(newRecord);
  }

  // Helper function to update an existing record
  private async updateExistingRecord(
    existingRecord: any,
    incomingScore: any,
    isSubmitted: boolean,
  ): Promise<void> {
    const dbScore = existingRecord.score;

    for (const roundKey in incomingScore) {
      const incomingRound = incomingScore[roundKey];

      if (!dbScore[roundKey]) {
        // If new round, add it
        dbScore[roundKey] = incomingRound;
        dbScore[roundKey].submitted = isSubmitted; // Set submitted field
      } else {
        // Round already exists in DB
        const dbRound = dbScore[roundKey];

        if (
          dbRound.submitted &&
          incomingRound.qualified !== dbRound.qualified
        ) {
          // Error if trying to change qualified when submitted is true
          throw new BadRequestException(
            `Cannot change qualified status for ${roundKey} for registrationId ${existingRecord.registrationId}`,
          );
        }

        // If submitted is false, replace all data
        if (!dbRound.submitted) {
          dbScore[roundKey] = incomingRound;
          dbScore[roundKey].submitted = isSubmitted;
        } else {
          // If submitted is true, only update scores
          dbScore[roundKey].scores = incomingRound.scores;
          dbScore[roundKey].bestScore = Math.max(...incomingRound.scores);

          // If this is the submit call, mark it as submitted
          if (isSubmitted) {
            dbScore[roundKey].submitted = true;
          }
        }
      }
    }

    // Save the updated record
    await this.highJumpRepository.save(existingRecord);
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
