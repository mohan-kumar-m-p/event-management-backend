import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { RoundService } from './round.service';

@UseGuards(AuthGuard('jwt'))
@Controller('round')
export class RoundController {
  constructor(private readonly roundService: RoundService) {}

  @Get(':id/athletes')
  async getQualifiedAthletesByRound(
    @Param('id') roundId: string,
  ): Promise<ApiResponse<any>> {
    const athletes =
      await this.roundService.getQualifiedAthletesByRound(roundId);
    return ApiResponse.success(
      `All athletes that are qualified for round with ID ${roundId} fetched successfully`,
      athletes,
    );
  }

  @Post('complete-round/:id')
  async markRoundAsComplete(
    @Param('id') id: string,
  ): Promise<ApiResponse<any>> {
    const round = await this.roundService.markRoundAsComplete(id);
    return ApiResponse.success(`Event with ID ${id} marked as complete`, round);
  }

  @Get(':id')
  async getRoundById(@Param('id') id: string): Promise<ApiResponse<any>> {
    const round = await this.roundService.getRoundById(id);
    return ApiResponse.success(
      `Round with ID ${id} retrieved successfully`,
      round,
    );
  }
}
