import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import { LoginPhoneDto } from '../dto/loginPhone.dto';
import { LoginEmailDto } from '../dto/loginEmail.dto';

@Injectable()
export class OtpEmailStrategy extends PassportStrategy(Strategy, 'otp-email') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const loginEmailDto = plainToClass(LoginEmailDto, req.body);
    const errors = await validate(loginEmailDto);

    if (errors.length > 0) {
      // Extract only the relevant error messages
      const formattedErrors = errors.map((error) => ({
        property: error.property,
        constraints: error.constraints,
      }));

      throw new BadRequestException({
        success: false,
        message: formattedErrors,
      });
    }

    const { entity, email, otp } = loginEmailDto;
    const user = await this.authService.validateOtpPhone(
      entity,
      email,
      otp,
    );

    return user;
  }
}
