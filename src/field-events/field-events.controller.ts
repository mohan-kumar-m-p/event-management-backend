import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/role.guard';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { OrganizerRole } from '../shared/roles';
import { CreateHighJumpDto } from './dtos/highJump.dto';
import { FieldEventsService } from './field-events.service';
import { CreateFieldEventDto } from './dtos/field-event.dto';

// @UseGuards(RolesGuard([OrganizerRole.MeetManager]))
@Controller('field-events')
export class FieldEventsController {
  constructor(private readonly fieldEventsService: FieldEventsService) {}

  @Get('highjump-score/event/:eventId/registrationId/:registrationId')
  async getHighJumpScore(
    @Param('eventId') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    const highJump = await this.fieldEventsService.getHighJumpScore(
      eventId,
      registrationId,
    );
    return ApiResponse.success('High jumps retrieved successfully', highJump);
  }

  @Post('highjump-score')
  async saveHighJumpScore(@Body() createHighJumpDto: CreateHighJumpDto) {
    await this.fieldEventsService.saveHighJumpScore(createHighJumpDto);
    return ApiResponse.success('High jump score created successfully');
  }

  @Get('score/event/:eventId/registrationId/:registrationId')
  async getFieldEventScore(
    @Param('eventId') eventId: string,
    @Param('registrationId') registrationId: string,
  ) {
    const highJump = await this.fieldEventsService.getFieldEventScore(
      eventId,
      registrationId,
    );
    return ApiResponse.success('Field events retrieved successfully', highJump);
  }

  @Post('score')
  async saveFieldEventScore(@Body() createFieldEventDto: CreateFieldEventDto) {
    await this.fieldEventsService.saveFieldEventScore(createFieldEventDto);
    return ApiResponse.success('Field events score created successfully');
  }
}
