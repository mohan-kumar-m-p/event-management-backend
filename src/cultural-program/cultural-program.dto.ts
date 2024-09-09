import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProgramCategory } from './enum/program-category.enum';

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
  category: ProgramCategory;

  @IsOptional()
  @IsString()
  mediaUrl: string;
}
