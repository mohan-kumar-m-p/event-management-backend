import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ManagerDto } from './manager.dto';
import { ManagerService } from './manager.service';
import { ApiResponse } from 'src/shared/dto/api-response.dto';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post()
  async create(@Body() managerDto: ManagerDto): Promise<ApiResponse<any>> {
    const manager = await this.managerService.createManager(managerDto);
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

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() managerDto: ManagerDto,
  ): Promise<ApiResponse<any>> {
    const updatedManager = await this.managerService.updateManager(
      id,
      managerDto,
    );
    return ApiResponse.success('Manager updated successfully', updatedManager);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<any>> {
    await this.managerService.deleteManager(id);
    return ApiResponse.success('Manager deleted successfully');
  }
}
