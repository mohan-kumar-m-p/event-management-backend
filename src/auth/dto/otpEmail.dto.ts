import { IsNotEmpty, IsString } from 'class-validator';
import { Entity } from '../entity.enum';

export class OtpEmailDto {
  @IsString()
  @IsNotEmpty()
  entity: Entity;

  @IsString()
  @IsNotEmpty()
  email: string;
}
