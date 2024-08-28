import { Controller, Get, Param } from '@nestjs/common';
import { EventService } from './event.service';
import { ApiResponse } from 'src/shared/dto/api-response.dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const events = await this.eventService.findAll();
    return ApiResponse.success('Events retrieved successfully', events);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const event = await this.eventService.findOne(id);
    return ApiResponse.success('Event retrieved successfully', event);
  }
}
