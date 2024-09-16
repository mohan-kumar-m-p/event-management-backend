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
import { CreateFieldEventDto } from './dtos/field-event.dto';
import { CreateHighJumpDto } from './dtos/highJump.dto';
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

  async getHighJumpScore(eventId: string, registrationId: string) {
    try {
      const highJumps = await this.highJumpRepository.findOne({
        where: { eventId, registrationId },
      });
      if (!highJumps) {
        throw new NotFoundException(
          `No high jump score found for registrationId ${registrationId} and eventId ${eventId}`,
        );
      }
      const athlete = await this.athleteRepository.findOne({
        where: { registrationId },
      });
      if (!athlete) {
        throw new NotFoundException(
          `Athlete with registrationID ${registrationId} not found`,
        );
      }
      highJumps['athleteName'] = athlete.name;
      highJumps['chestNumber'] = athlete.chestNumber;
      return highJumps;
    } catch (error) {
      this.logger.error(`Error while getting high jump score: ${error}`);
      throw error;
    }
  }

  async saveHighJumpScore(createHighJumpDto: CreateHighJumpDto) {
    try {
      const existingHighJump = await this.highJumpRepository.findOne({
        where: {
          eventId: createHighJumpDto.eventId,
          registrationId: createHighJumpDto.registrationId,
        },
      });

      if (!existingHighJump) {
        await this.highJumpRepository.save(createHighJumpDto);
      } else {
        existingHighJump.scores = createHighJumpDto.scores;
        await this.highJumpRepository.save(existingHighJump);
      }
    } catch (error) {
      this.logger.error(`Error while saving high jump score: ${error}`);
      throw error;
    }
  }

  async getFieldEventScore(eventId: string, registrationId: string) {
    try {
      const fieldEvent = await this.fieldEventsRepository.findOne({
        where: { eventId, registrationId },
      });
      if (!fieldEvent) {
        throw new NotFoundException(
          `No field event score found for registrationId ${registrationId} and eventId ${eventId}`,
        );
      }
      const athlete = await this.athleteRepository.findOne({
        where: { registrationId },
      });
      if (!athlete) {
        throw new NotFoundException(
          `Athlete with registrationID ${registrationId} not found`,
        );
      }
      fieldEvent['athleteName'] = athlete.name;
      fieldEvent['chestNumber'] = athlete.chestNumber;
      return fieldEvent;
    } catch (error) {
      this.logger.error(`Error while getting field event score: ${error}`);
      throw error;
    }
  }

  async saveFieldEventScore(createFieldEventDto: CreateFieldEventDto) {
    try {
      const existingFieldEvent = await this.fieldEventsRepository.findOne({
        where: {
          eventId: createFieldEventDto.eventId,
          registrationId: createFieldEventDto.registrationId,
        },
      });

      if (!existingFieldEvent) {
        await this.fieldEventsRepository.save(createFieldEventDto);
      } else {
        existingFieldEvent.scores = createFieldEventDto.scores;
        if (existingFieldEvent.scores.length > 3) {
          throw new BadRequestException(
            'Field events can have only up to 3 scoroes',
          );
        }
        await this.fieldEventsRepository.save(existingFieldEvent);
      }
    } catch (error) {
      this.logger.error(`Error while saving field event score: ${error}`);
      throw error;
    }
  }
}
