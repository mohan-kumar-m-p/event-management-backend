import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class UpdateManagerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  affiliationNumber: string;

  @IsNotEmpty()
  @IsString()
  dob: string;

  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsNotEmpty()
  @IsString()
  aadhaarNumber: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  emailId: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(['true', 'false'], {
    message: 'needAccomodation must be either "true" or "false"',
  })
  needAccomodation: string;
}
