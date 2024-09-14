import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { RolesGuard } from '../guards/role.guard';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { OrganizerRole } from '../shared/roles';
import { CreateHighJumpDto } from './dtos/highJump.dto';
import { FieldEventsService } from './field-events.service';

// @UseGuards(RolesGuard([OrganizerRole.MeetManager]))
@Controller('field-events')
export class FieldEventsController {
  constructor(private readonly fieldEventsService: FieldEventsService) {}

  // @Post('save-highjump-score/event/:eventId/round/:roundNumber')
  // async saveHighJumpScore(
  //   @Param('eventId') eventId: string,
  //   @Param('roundNumber') roundNumber: string,
  //   @Body() createHighJumpRoundDto: CreateHighJumpRoundDto,
  // ) {
  //   await this.fieldEventsService.saveHighJumpScore(
  //     createHighJumpRoundDto,
  //     eventId,
  //     roundNumber,
  //   );
  //   return ApiResponse.success('High jump score created successfully');
  // }

  // @Post('submit-highjump-score/event/:eventId/round/:roundNumber')
  // async submitHighJumpScore(
  //   @Param('eventId') eventId: string,
  //   @Param('roundNumber') roundNumber: string,
  //   @Body() createHighJumpRoundDto: CreateHighJumpRoundDto,
  // ) {
  //   await this.fieldEventsService.submitHighJumpScore(
  //     createHighJumpRoundDto,
  //     eventId,
  //     roundNumber,
  //   );
  //   return ApiResponse.success('High jump score created successfully');
  // }

  // @Post('create-highjump-round/:eventId/round/:roundNumber')
  // async createHighJumpRound(
  //   @Param('eventId') eventId: string,
  //   @Param('roundNumber') roundNumber: number,
  // ) {
  //   const highJumps = await this.fieldEventsService.createHighJumpRound(
  //     eventId,
  //     roundNumber,
  //   );
  //   return ApiResponse.success('High jumps retrieved successfully', highJumps);
  // }

  // @Get('highjump-score-by-event/:eventId')
  // async getHighJumpsByEvent(@Param('eventId') eventId: string) {
  //   const highJumps =
  //     await this.fieldEventsService.getHighJumpsByEvent(eventId);
  //   return ApiResponse.success('High jumps retrieved successfully', highJumps);
  // }

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
}
