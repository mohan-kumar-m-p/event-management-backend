import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../guards/role.guard';
import { ApiResponse } from '../shared/dto/api-response.dto';
import { OrganizerRole } from '../shared/roles';
import { HeatService } from './heat.service';

@UseGuards(AuthGuard('jwt'), RolesGuard([OrganizerRole.MeetManager]))
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
    const heat = await this.heatService.generateFinalHeat(roundId);
    return ApiResponse.success('Final heat generated successfully', heat);
  }

  @Post(':roundId/generate-relay-qualifier-heats')
  async generateRelayQualifierHeats(
    @Param('roundId') roundId: string,
  ): Promise<ApiResponse<any>> {
    const heat = await this.heatService.generateRelayQualifierHeats(roundId);
    return ApiResponse.success(
      `Qualifier heat for relay round with IF ${roundId} generated successfully`,
      heat,
    );
  }
}
