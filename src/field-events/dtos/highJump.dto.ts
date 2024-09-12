import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class RoundDTO {
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  scores: number[];

  @IsBoolean()
  @IsOptional()
  qualified: boolean;

  @IsBoolean()
  @IsOptional()
  submitted: boolean;
}

export class HighJumpDto {
  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @ValidateNested({ each: true })
  @Type(() => RoundDTO)
  score: { [key: string]: RoundDTO };

  @IsString()
  @IsOptional()
  position?: string;
}
