import { Body, Controller, Get, Post } from '@nestjs/common';
import { HighJumpDto } from './dtos/highJump.dto';
import { FieldEventsService } from './field-events.service';
import { ApiResponse } from 'src/shared/dto/api-response.dto';

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
}
