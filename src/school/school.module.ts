import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolService } from './school.service';
import { SchoolController } from './school.controller';
import { School } from './school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([School])],
  providers: [SchoolService],
  controllers: [SchoolController],
})
export class SchoolModule {}
