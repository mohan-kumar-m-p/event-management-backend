import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAthleteDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  affiliationNumber?: string;

  @IsNotEmpty()
  @IsString()
  dob: string;

  @IsNotEmpty()
  @IsString()
  gender: string;

  @IsOptional()
  @IsString()
  aadhaarNumber: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  emailId: string;

  @IsOptional()
  @IsString()
  nameOfFather: string;

  @IsOptional()
  @IsString()
  nameOfMother: string;

  @IsNotEmpty()
  @IsString()
  class: string;

  @IsOptional()
  @IsString()
  admissionNumber?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
