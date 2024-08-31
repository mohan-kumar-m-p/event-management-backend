import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // Ensure this import is present
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organizer } from '../organizer/organizer.entity';
import { OrganizerService } from '../organizer/organizer.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { jwtConstants } from './utils/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
    TypeOrmModule.forFeature([Organizer]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OrganizerService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
