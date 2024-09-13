import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Event } from '../event/event.entity';
import { FieldEvents } from './entities/field-events.entity';
import { HighJump } from './entities/high-jump.entity';
import { FieldEventsController } from './field-events.controller';
import { FieldEventsService } from './field-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([FieldEvents, HighJump, Athlete, Event])],
  controllers: [FieldEventsController],
  providers: [FieldEventsService],
})
export class FieldEventsModule {}
