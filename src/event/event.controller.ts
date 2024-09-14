import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { EventService } from './event.service';

@UseGuards(AuthGuard('jwt'))
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const events = await this.eventService.findAll();
    return ApiResponse.success('Events retrieved successfully', events);
  }

  @Get('individual-events')
  async findIndividualEvents(): Promise<ApiResponse<any>> {
    const events = await this.eventService.findIndividualEvents();
    return ApiResponse.success(
      'Individual events retrieved successfully',
      events,
    );
  }

  @Get('group-events')
  async findGroupEvents(): Promise<ApiResponse<any>> {
    const events = await this.eventService.findGroupEvents();
    return ApiResponse.success('Group events retrieved successfully', events);
  }

  @Get('past-events')
  async findAllPastEvents(): Promise<ApiResponse<any>> {
    const events = await this.eventService.findAllPastEvents();
    return ApiResponse.success('Past events retrieved successfully', events);
  }

  @Get('upcoming-events')
  async findAllUpcomingEvents(): Promise<ApiResponse<any>> {
    const events = await this.eventService.findAllUpcomingEvents();
    return ApiResponse.success(
      'Upcoming events retrieved successfully',
      events,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const event = await this.eventService.findOne(id);
    return ApiResponse.success('Event retrieved successfully', event);
  }

  @Post('complete-event/:id')
  async markEventAsComplete(
    @Param('id') id: string,
  ): Promise<ApiResponse<any>> {
    const event = await this.eventService.markEventAsComplete(id);
    return ApiResponse.success(`Event with ID ${id} marked as complete`, event);
  }

  @Get('athletes-by-event/:eventId')
  async getAthletesByEvent(@Param('eventId') eventId: string) {
    const athletes = await this.eventService.getAthletesByEvent(eventId);
    return ApiResponse.success('Athletes retrieved successfully', athletes);
  }
}
