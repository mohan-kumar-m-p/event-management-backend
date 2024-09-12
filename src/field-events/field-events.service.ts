import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HighJumpDto } from './dtos/highJump.dto';
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
  ) {}

  // Save method (sets submitted to false but respects existing 'submitted' records)
  async saveHighJumpScore(highJumpDto: HighJumpDto[]) {
    try {
      for (const entry of highJumpDto) {
        const { registrationId, eventId, score } = entry;
        const existingRecord = await this.highJumpRepository.findOne({
          where: { registrationId, eventId },
        });

        if (!existingRecord) {
          await this.saveNewRecord(entry, false); // Set submitted to false
        } else {
          await this.updateExistingRecord(existingRecord, score, false); // Don't change submitted, throw error if qualified changes
        }
      }
    } catch (error) {
      this.logger.error(`Error saving high jump score: ${error}`);
      throw error;
    }
  }

  // Submit method (sets submitted to true but respects existing 'submitted' records)
  async submitHighJumpScore(highJumpDto: HighJumpDto[]) {
    try {
      for (const entry of highJumpDto) {
        const { registrationId, eventId, score } = entry;
        const existingRecord = await this.highJumpRepository.findOne({
          where: { registrationId, eventId },
        });

        if (!existingRecord) {
          await this.saveNewRecord(entry, true); // Set submitted to true
        } else {
          await this.updateExistingRecord(existingRecord, score, true); // Check qualified, set submitted to true
        }
      }
    } catch (error) {
      this.logger.error(`Error submitting high jump score: ${error}`);
      throw error;
    }
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

  async getHighJumpScore() {
    const highJumps = await this.highJumpRepository.find();
    return highJumps;
  }

  async getHighJumpsByEvent(eventId: string) {
    const highJumps = await this.highJumpRepository.find({
      where: { eventId },
    });
    return highJumps;
  }
}
