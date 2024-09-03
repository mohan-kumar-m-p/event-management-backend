import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class TransportDetailsDto {
  @IsNotEmpty()
  @IsString()
  transport: string;

  @IsNotEmpty()
  @IsString()
  dateOfArrival: string;

  @IsNotEmpty()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time of arrival must be in HH:MM format',
  })
  timeOfArrival: string;

  @IsNotEmpty()
  @IsString()
  pickUpLocation: string;
}
