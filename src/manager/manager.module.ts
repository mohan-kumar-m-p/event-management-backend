import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from 'src/shared/shared.module';
import { Accommodation } from '../accommodation/accommodation.entity';
import { School } from '../school/school.entity';
import { ManagerController } from './manager.controller';
import { Manager } from './manager.entity';
import { ManagerService } from './manager.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Manager, School, Accommodation]),
    SharedModule,
  ],
  controllers: [ManagerController],
  providers: [ManagerService],
  exports: [ManagerService],
})
export class ManagerModule {}
