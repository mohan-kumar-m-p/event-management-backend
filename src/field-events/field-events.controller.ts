import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { HighJumpDto } from './dtos/highJump.dto';
import { FieldEventsService } from './field-events.service';

@Controller('field-events')
export class FieldEventsController {
  constructor(private readonly fieldEventsService: FieldEventsService) {}

  @Post('save-highjump-score')
  async saveHighJumpScore(@Body() highJumpDto: HighJumpDto[]) {
    await this.fieldEventsService.saveHighJumpScore(highJumpDto);
    return ApiResponse.success('High jump score created successfully');
  }

  @Post('submit-highjump-score')
  async submitHighJumpScore(@Body() highJumpDto: HighJumpDto[]) {
    await this.fieldEventsService.submitHighJumpScore(highJumpDto);
    return ApiResponse.success('High jump score created successfully');
  }

  @Get('highjump-score')
  async getHighJumpsScore() {
    const highJumps = await this.fieldEventsService.getHighJumpScore();
    return ApiResponse.success('High jumps retrieved successfully', highJumps);
  }

  @Get('highjump-score-by-event/:eventId')
  async getHighJumpsByEvent(@Param('eventId') eventId: string) {
    const highJumps =
      await this.fieldEventsService.getHighJumpsByEvent(eventId);
    return ApiResponse.success('High jumps retrieved successfully', highJumps);
  }
}
