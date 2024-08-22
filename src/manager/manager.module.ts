import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ManagerService } from './manager.service';
import { ManagerController } from './manager.controller';
import { Manager } from './manager.entity';
import { School } from 'src/school/school.entity';
import { Accommodation } from 'src/accommodation/accommodation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Manager, School, Accommodation])],
  controllers: [ManagerController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
