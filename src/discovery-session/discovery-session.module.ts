import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SharedModule } from '../shared/shared.module';
import { DiscoverySessionController } from './discovery-session.controller';
import { DiscoverySession } from './discovery-session.entity';
import { DiscoverySessionService } from './discovery-session.service';

@Module({
  imports: [TypeOrmModule.forFeature([DiscoverySession]), SharedModule],
  controllers: [DiscoverySessionController],
  providers: [DiscoverySessionService, JwtService],
  exports: [DiscoverySessionService],
})
export class DiscoverySessionModule {}
