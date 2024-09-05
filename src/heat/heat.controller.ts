import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { HeatService } from './heat.service';

@UseGuards(AuthGuard('jwt'))
@Controller('heat')
export class HeatController {
  constructor(private readonly heatService: HeatService) {}

  @Post(':roundId/generate-qualifier-heats')
  async generateQualifierHeats(
    @Param('roundId') roundId: string,
  ): Promise<ApiResponse<any>> {
    const heats = await this.heatService.generateQualifierHeats(roundId);
    return ApiResponse.success('Qualifier heats generated successfully', heats);
  }

  @Post(':roundId/generate-semifinal-heats')
  async generateSemiFinalHeats(
    @Param('roundId') roundId: string,
  ): Promise<ApiResponse<any>> {
    const heats = await this.heatService.generateSemifinalHeats(roundId);
    return ApiResponse.success('Semifinal heats generated successfully', heats);
  }

  @Post(':roundId/generate-final-heat')
  async generateFinalHeat(
    @Param('roundId') roundId: string,
  ): Promise<ApiResponse<any>> {
    const heat = await this.heatService.generateSemifinalHeats(roundId);
    return ApiResponse.success('Final heat generated successfully', heat);
  }
}
