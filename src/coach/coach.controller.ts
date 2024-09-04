import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { CreateCoachDto } from './dto/create-coach.dto';
import { UpdateCoachDto } from './dto/update-coach.dto';
import { CoachService } from './coach.service';
import { Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AuthGuard('jwt'))
@Controller('coach')
export class CoachController {
  constructor(private readonly coachService: CoachService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() coachDto: CreateCoachDto,
    @UploadedFile() photo: Express.Multer.File,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const schoolAffiliationNumber = req?.user?.entity || null;
    const coach = await this.coachService.createCoach(
      coachDto,
      schoolAffiliationNumber,
      photo,
    );
    return ApiResponse.success(
      'Coach created successfully',
      coach,
      HttpStatus.CREATED,
    );
  }

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const coaches = await this.coachService.findAll();
    return ApiResponse.success('Coaches retrieved successfully', coaches);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const coach = await this.coachService.findOne(id);
    return ApiResponse.success(
      `Coach with ID ${id} retrieved successfully`,
      coach,
    );
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() coachDto: UpdateCoachDto,
    @UploadedFile() photo: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    const updatedCoach = await this.coachService.updateCoach(id, coachDto, photo);
    return ApiResponse.success(
      `Coach with ID ${id} updated successfully`,
      updatedCoach,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.coachService.deleteCoach(id);
    return ApiResponse.success(`Coach with ID ${id} deleted successfully`);
  }
}
