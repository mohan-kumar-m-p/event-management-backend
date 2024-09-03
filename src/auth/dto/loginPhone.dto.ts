import { IsNotEmpty, IsString } from 'class-validator';
import { Entity } from '../entity.enum';

export class LoginPhoneDto {
  @IsString()
  @IsNotEmpty()
  entity: Entity;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
