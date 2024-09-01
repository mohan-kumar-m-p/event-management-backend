import { IsDate, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCoachDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  affiliationNumber: string;

  @IsNotEmpty()
  @IsDate()
  dob: Date;

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
}
