import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';

// DTO for athlete details
export class CreateHighJumpDto {
  @IsString()
  @IsNotEmpty()
  registrationId: string;

  @IsString()
  @IsNotEmpty()
  eventId: string;

  @IsArray()
  @IsArray({ each: true })
  scores: number[][];

  // @IsBoolean()
  // @IsNotEmpty()
  // qualified: boolean;

  // @IsBoolean()
  // @IsOptional()
  // submitted: boolean;
}

// DTO for the entire request body
// export class CreateHighJumpRoundDto {
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => AthleteDetailsDto)
//   athleteDetails: AthleteDetailsDto[];
// }
