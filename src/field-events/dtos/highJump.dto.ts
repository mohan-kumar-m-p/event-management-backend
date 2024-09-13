import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO for athlete details
class AthleteDetailsDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  scores: number[];

  @IsBoolean()
  @IsNotEmpty()
  qualified: boolean;

  @IsBoolean()
  @IsOptional()
  submitted: boolean;
}

// DTO for the entire request body
export class CreateHighJumpRoundDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AthleteDetailsDto)
  athleteDetails: AthleteDetailsDto[];
}
