import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt'; // Ensure this import is present
import { TypeOrmModule } from '@nestjs/typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { Organizer } from '../organizer/organizer.entity';
import { OrganizerService } from '../organizer/organizer.service';
import { School } from '../school/school.entity';
import { EmailService } from '../shared/services/email.service';
import { SmsService } from '../shared/services/sms.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OtpEmailStrategy } from './strategies/otpEmail.strategy';
import { OtpPhoneStrategy } from './strategies/otpPhone.strategy';
import { jwtConstants } from './utils/constants';

@Module({
  imports: [
    JwtModule.register({
      secret: jwtConstants.secret,
    }),
    TypeOrmModule.forFeature([Organizer, School, Manager, Coach, Athlete]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OrganizerService,
    LocalStrategy,
    JwtStrategy,
    OtpPhoneStrategy,
    EmailService,
    OtpEmailStrategy,
    SmsService,
  ],
})
export class AuthModule {}
