import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldEvents } from './entities/field-events.entity';
import { HighJump } from './entities/high-jump.entity';
import { FieldEventsController } from './field-events.controller';
import { FieldEventsService } from './field-events.service';

@Module({
  imports: [TypeOrmModule.forFeature([FieldEvents, HighJump])],
  controllers: [FieldEventsController],
  providers: [FieldEventsService],
})
export class FieldEventsModule {}
