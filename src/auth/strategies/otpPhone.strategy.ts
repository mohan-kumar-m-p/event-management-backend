import { BadRequestException, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { Strategy } from 'passport-custom';
import { AuthService } from '../auth.service';
import { LoginPhoneDto } from '../dto/loginPhone.dto';

@Injectable()
export class OtpPhoneStrategy extends PassportStrategy(Strategy, 'otp-phone') {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(req: any): Promise<any> {
    const loginPhoneDto = plainToClass(LoginPhoneDto, req.body);
    const errors = await validate(loginPhoneDto);

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

    const { entity, phoneNumber, otp } = loginPhoneDto;
    const user = await this.authService.validateOtpPhone(
      entity,
      phoneNumber,
      otp,
    );

    return user;
  }
}
