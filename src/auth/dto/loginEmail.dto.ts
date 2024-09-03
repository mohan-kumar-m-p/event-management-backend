import { IsNotEmpty, IsString } from 'class-validator';
import { Entity } from '../entity.enum';

export class LoginEmailDto {
  @IsString()
  @IsNotEmpty()
  entity: Entity;

  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  otp: string;
}
