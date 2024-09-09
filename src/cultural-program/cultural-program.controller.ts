import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { CulturalProgramDto } from './cultural-program.dto';
import { CulturalProgramService } from './cultural-program.service';
import { RolesGuard } from 'src/guards/role.guard';
import { OrganizerRole } from 'src/shared/roles';

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

  @Get('student/:studentId')
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
}
