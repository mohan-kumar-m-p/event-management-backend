import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../guards/role.guard';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { OrganizerRole } from '../shared/roles';
import { CulturalProgramDto } from './cultural-program.dto';
import { CulturalProgramService } from './cultural-program.service';

@UseGuards(AuthGuard('jwt'))
@Controller('cultural-program')
export class CulturalProgramController {
  constructor(
    private readonly culturalProgramService: CulturalProgramService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() culturalProgramDto: CulturalProgramDto,
    @UploadedFile() media: Express.Multer.File,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const schoolAffiliationNumber = culturalProgramDto.affiliationNumber
      ? culturalProgramDto.affiliationNumber
      : req?.user?.sub;

    const culturalProgram =
      await this.culturalProgramService.createCulturalProgram(
        culturalProgramDto,
        schoolAffiliationNumber,
        media,
      );
    return ApiResponse.success(
      'Cultural program created successfully',
      culturalProgram,
      HttpStatus.CREATED,
    );
  }

  @Get()
  @UseGuards(RolesGuard([OrganizerRole.CulturalProgramCoordinator]))
  async findAll(): Promise<ApiResponse<any>> {
    const culturalPrograms = await this.culturalProgramService.findAll();
    return ApiResponse.success(
      'Cultural programs fetched successfully',
      culturalPrograms,
    );
  }

  @Get('athlete/:registrationId')
  async findAllByStudent(
    @Param('registrationId') registrationId: string,
  ): Promise<ApiResponse<any>> {
    const culturalPrograms =
      await this.culturalProgramService.findAllByStudent(registrationId);
    return ApiResponse.success(
      `Cultural programs for student with Id ${registrationId} fetched successfully`,
      culturalPrograms,
    );
  }

  @Get('school/:affiliationNumber')
  async findAllBySchool(
    @Param('affiliationNumber') affiliationNumber: string,
  ): Promise<ApiResponse<any>> {
    const culturalPrograms =
      await this.culturalProgramService.findAllBySchool(affiliationNumber);
    return ApiResponse.success(
      `Cultural programs for school with affiliation number ${affiliationNumber} fetched successfully`,
      culturalPrograms,
    );
  }

  @Put()
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Body() culturalProgramDto: CulturalProgramDto,
    @UploadedFile() media: Express.Multer.File,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const schoolAffiliationNumber = culturalProgramDto.affiliationNumber
      ? culturalProgramDto.affiliationNumber
      : req?.user?.sub;

    const culturalProgram =
      await this.culturalProgramService.updateCulturalProgram(
        culturalProgramDto,
        schoolAffiliationNumber,
        media,
      );
    return ApiResponse.success(
      'Cultural program created successfully',
      culturalProgram,
      HttpStatus.CREATED,
    );
  }
}
