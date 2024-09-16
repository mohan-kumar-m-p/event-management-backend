import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateFieldEventDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsArray()
  @IsArray({ each: true })
  scores: number[][];
}
