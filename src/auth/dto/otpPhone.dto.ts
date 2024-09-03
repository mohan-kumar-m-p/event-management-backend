import { IsNotEmpty, IsString } from 'class-validator';
import { Entity } from '../entity.enum';

export class OtpPhoneDto {
  @IsString()
  @IsNotEmpty()
  entity: Entity;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}
