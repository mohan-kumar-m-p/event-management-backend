import { IsNotEmpty, IsString, IsDate, IsOptional } from 'class-validator';

export class CreateManagerDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
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
