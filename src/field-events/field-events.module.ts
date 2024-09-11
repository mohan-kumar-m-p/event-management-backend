import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FieldEvents } from './entities/field-events.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FieldEvents])],
})
export class FieldEventsModule {}
