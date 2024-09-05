import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ProgramCategory } from './program-category.enum';

export class CulturalProgramDto {
  @IsNotEmpty()
  @IsString()
  athleteId: string;

  @IsOptional()
  @IsString()
  affiliationNumber: string;

  @IsNotEmpty()
  @IsString()
  category: ProgramCategory;

  @IsOptional()
  @IsString()
  mediaUrl: string;
}
