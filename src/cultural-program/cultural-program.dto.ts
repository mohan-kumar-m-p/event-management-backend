import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CulturalProgramDto {
  @IsNotEmpty()
  @IsString()
  athleteId: string;

  @IsOptional()
  @IsString()
  affiliationNumber: string;

  @IsNotEmpty()
  @IsString()
  date: string;

  @IsNotEmpty()
  @IsString()
  time: string;

  @IsNotEmpty()
  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  mediaUrl: string;
}
