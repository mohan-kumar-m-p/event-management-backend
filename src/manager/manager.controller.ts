import {
  Body,
  Controller,
  Delete,
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
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { ManagerService } from './manager.service';

@UseGuards(AuthGuard('jwt'))
@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post()
  @UseInterceptors(FileInterceptor('photo'))
  async create(
    @Body() managerDto: CreateManagerDto,
    @UploadedFile() photo: Express.Multer.File,
    @Request() req,
  ): Promise<ApiResponse<any>> {
    const schoolAffiliationNumber = managerDto.affiliationNumber
      ? managerDto.affiliationNumber
      : req?.user?.sub;

    const manager = await this.managerService.createManager(
      managerDto,
      schoolAffiliationNumber,
      photo,
    );
    return ApiResponse.success(
      'Manager created successfully',
      manager,
      HttpStatus.CREATED,
    );
  }

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const managers = await this.managerService.findAll();
    return ApiResponse.success('Managers retrieved successfully', managers);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const manager = await this.managerService.findOne(id);
    return ApiResponse.success('Manager retrieved successfully', manager);
  }

  @Get('school/:id')
  async findAllBySchool(@Param('id') id: string): Promise<ApiResponse<any>> {
    const managers = await this.managerService.findAllBySchool(id);
    return ApiResponse.success('Coaches retrieved successfully', managers);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('photo'))
  async update(
    @Param('id') id: string,
    @Body() managerDto: UpdateManagerDto,
    @UploadedFile() photo: Express.Multer.File,
  ): Promise<ApiResponse<any>> {
    const updatedManager = await this.managerService.updateManager(
      id,
      managerDto,
      photo,
    );
    return ApiResponse.success('Manager updated successfully', updatedManager);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.managerService.deleteManager(id);
    return ApiResponse.success('Manager deleted successfully');
  }

    // TODO add new endpoint for all events this manager has by using school affiliation number from JWT

}
