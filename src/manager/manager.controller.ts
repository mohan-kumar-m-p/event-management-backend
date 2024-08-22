import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ManagerDto } from './manager.dto';
import { ManagerService } from './manager.service';

@Controller('manager')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  @Post()
  create(@Body() managerDto: ManagerDto) {
    return this.managerService.createManager(managerDto);
  }

  @Get()
  findAll() {
    return this.managerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.managerService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() managerDto: ManagerDto) {
    return this.managerService.updateManager(id, managerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.managerService.deleteManager(id);
  }
}
