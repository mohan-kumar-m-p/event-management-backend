import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organizer } from './organizer.entity';
import { OrganizerService } from './organizer.service';

@Module({
  imports: [TypeOrmModule.forFeature([Organizer])],
  providers: [OrganizerService],
  exports: [OrganizerService],
})
export class OrganizerModule {}
