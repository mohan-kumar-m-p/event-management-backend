import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoundService } from './round.service';
import { ApiResponse } from '../shared/dto/api-response.dto';

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
}
