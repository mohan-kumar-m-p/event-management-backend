import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { School } from './school.entity';
import { Athlete } from 'src/athlete/athlete.entity';
import { Manager } from 'src/manager/manager.entity';
import { Coach } from 'src/coach/coach.entity';
import { Event } from 'src/event/event.entity';
import { SharedModule } from 'src/shared/shared.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([School, Athlete, Manager, Coach, Event]),
    SharedModule,
  ],
  providers: [SchoolService],
  controllers: [SchoolController],
})
export class SchoolModule {}
