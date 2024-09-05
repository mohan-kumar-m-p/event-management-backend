import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateManagerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
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
