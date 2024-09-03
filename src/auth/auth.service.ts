import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomInt } from 'crypto';
import { Repository } from 'typeorm';
import { Athlete } from '../athlete/athlete.entity';
import { Coach } from '../coach/coach.entity';
import { Manager } from '../manager/manager.entity';
import { OrganizerService } from '../organizer/organizer.service';
import { School } from '../school/school.entity';
import { EmailService } from '../shared/services/email.service';
import { SmsService } from '../shared/services/sms.service';
import { Entity } from './entity.enum';
import { verifyPassword } from './utils/utils';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private organizerService: OrganizerService,
    private jwtService: JwtService,
    @InjectRepository(School)
    private schoolRepository: Repository<School>,
    @InjectRepository(Manager)
    private managerRepository: Repository<Manager>,
    @InjectRepository(Coach)
    private coachRepository: Repository<Coach>,
    @InjectRepository(Athlete)
    private athleteRepository: Repository<Athlete>,
    private emailService: EmailService,
    private smsService: SmsService,
  ) {}

  async authenticateOrganizer(
    loginRequestEmail: string,
    loginRequestPassword: string,
  ) {
    const organizer =
      await this.organizerService.getLoginOrganizer(loginRequestEmail);
    if (!organizer) {
      throw new UnauthorizedException(
        `Invalid login credentials. Please try again`,
      );
    }
    const organizerPassword: string = organizer.password;
    const isPasswordVerified: boolean = await verifyPassword(
      loginRequestPassword,
      organizerPassword,
    );
    if (!isPasswordVerified) {
      throw new UnauthorizedException(
        `Invalid login credentials. Please try again`,
      );
    } else {
      delete organizer.password;
      return organizer;
    }
  }

  organizerLogin(
    authenticatedUser: Record<string, string>,
  ): Record<string, string> {
    const jwtPaylod: any = {
      sub: authenticatedUser.id,
      email: authenticatedUser.email,
      roles: authenticatedUser.roles,
    };
    return {
      access_token: this.jwtService.sign(jwtPaylod),
    };
  }

  async generateOtpPhone(entity: Entity, phoneNumber: any) {
    try {
      const otp = String(randomInt(100000, 1000000));
      if (entity === Entity.Manager) {
        const manager = await this.managerRepository.findOne({
          where: { phone: phoneNumber },
        });

        if (!manager) {
          throw new UnauthorizedException(
            `Manager with phone number ${phoneNumber} not found`,
          );
        }

        this.smsService.sendOtp(phoneNumber, otp);
        manager.otp = otp;
        manager.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await this.managerRepository.save(manager);
        return;
      } else if (entity === Entity.Coach) {
        const coach = await this.coachRepository.findOne({
          where: { phone: phoneNumber },
        });
        if (!coach) {
          throw new UnauthorizedException(
            `Coach with phone number ${phoneNumber} not found`,
          );
        }

        coach.otp = otp;
        coach.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await this.coachRepository.save(coach);
        return;
      } else if (entity === Entity.Athlete) {
        const athlete = await this.athleteRepository.findOne({
          where: { phone: phoneNumber },
        });
        if (!athlete) {
          throw new UnauthorizedException(
            `Athlete with phone number ${phoneNumber} not found`,
          );
        }

        athlete.otp = otp;
        athlete.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await this.athleteRepository.save(athlete);
        return;
      }
    } catch (error) {
      this.logger.error(
        `Error occured while generating OTP for phone, ${error}`,
      );
      throw error;
    }
  }

  async validateOtpPhone(
    entity: Entity,
    phoneNumber: string,
    otp: string,
  ): Promise<any> {
    try {
      let generatedOtp = null;
      if (entity === Entity.Manager) {
        const manager = await this.managerRepository.findOne({
          where: { phone: phoneNumber },
        });

        if (!manager) {
          throw new NotFoundException(
            `Manager with phone number ${phoneNumber} not found`,
          );
        }
        generatedOtp = manager.otp;
        if (!generatedOtp) {
          throw new BadRequestException(
            'No OTP found for user, please request to generate a new OTP',
          );
        }

        if (generatedOtp !== otp || manager.otpExpiry < new Date()) {
          throw new UnauthorizedException('Invalid OTP, please try again');
        }

        manager.otp = null;
        manager.otpExpiry = null;
        await this.managerRepository.save(manager);
        return manager;
      } else if (entity === Entity.Coach) {
        const coach = await this.coachRepository.findOne({
          where: { phone: phoneNumber },
        });

        if (!coach) {
          throw new NotFoundException(
            `Coach with phone number ${phoneNumber} not found`,
          );
        }
        generatedOtp = coach.otp;

        if (!generatedOtp) {
          throw new BadRequestException(
            'No OTP found for user, please request to generate a new OTP',
          );
        }

        if (generatedOtp !== otp || coach.otpExpiry < new Date()) {
          throw new UnauthorizedException('Invalid OTP, please try again');
        }

        coach.otp = null;
        coach.otpExpiry = null;
        await this.coachRepository.save(coach);
        return coach;
      } else if (entity === Entity.Athlete) {
        const athlete = await this.athleteRepository.findOne({
          where: { phone: phoneNumber },
        });

        if (!athlete) {
          throw new NotFoundException(
            `Athlete with phone number ${phoneNumber} not found`,
          );
        }
        generatedOtp = athlete.otp;
        if (!generatedOtp) {
          throw new BadRequestException(
            'No OTP found for user, please request to generate a new OTP',
          );
        }

        if (generatedOtp !== otp || athlete.otpExpiry < new Date()) {
          throw new UnauthorizedException('Invalid OTP, please try again');
        }

        athlete.otp = null;
        athlete.otpExpiry = null;
        await this.athleteRepository.save(athlete);
        return athlete;
      } else {
        throw new BadRequestException('Invalid entity');
      }
    } catch (error) {
      this.logger.error(`Error occurred while validating OTP phone, ${error}`);
      throw error;
    }
  }

  otpLogin(authenticatedUser: Record<string, string>): Record<string, string> {
    const jwtPaylod: any = {
      sub: authenticatedUser.id,
      affiliationNumber: authenticatedUser.affiliationNumber,
    };
    return {
      access_token: this.jwtService.sign(jwtPaylod),
    };
  }

  async generateOtpEmail(entity: Entity, email: any) {
    try {
      if (entity === Entity.School) {
        const otp = String(randomInt(100000, 1000000));
        const school = await this.schoolRepository.findOne({
          where: { emailId: email },
        });

        if (!school) {
          throw new UnauthorizedException(
            `Manager with phone number ${email} not found`,
          );
        }

        school.otp = otp;
        school.otpExpiry = new Date(Date.now() + 5 * 60 * 1000);
        await this.emailService.sendEmail({
          to: school.emailId,
          subject: 'OTP for Login',
          body: `Your OTP for login is ${otp}`,
        });
        await this.schoolRepository.save(school);
        return;
      } else throw new BadRequestException('Invalid entity');
    } catch (error) {
      this.logger.error(
        `Error occured while generating OTP for email, ${error}`,
      );
      throw error;
    }
  }

  async validateOtpEmail(
    entity: Entity,
    email: string,
    otp: string,
  ): Promise<any> {
    try {
      let generatedOtp = null;
      if (entity === Entity.School) {
        const school = await this.schoolRepository.findOne({
          where: { emailId: email },
        });

        if (!school) {
          throw new NotFoundException(`School with email ${email} not found`);
        }
        generatedOtp = school.otp;
        if (!generatedOtp) {
          throw new BadRequestException(
            'No OTP found for school, please request to generate a new OTP',
          );
        }

        if (generatedOtp !== otp || school.otpExpiry < new Date()) {
          throw new UnauthorizedException('Invalid OTP, please try again');
        }

        school.otp = null;
        school.otpExpiry = null;
        await this.schoolRepository.save(school);
        return school;
      }
    } catch (error) {
      this.logger.error(`Error occurred while validating OTP email, ${error}`);
      throw error;
    }
  }
}
