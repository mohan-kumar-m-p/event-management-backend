import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { AthleteHeat } from './athlete-heat.entity';
import { AthleteHeatService } from './athlete-heat.service';

@UseGuards(AuthGuard('jwt'))
@Controller('athlete-heat')
export class AthleteHeatController {
  constructor(private readonly athleteHeatService: AthleteHeatService) {}

  @Post(':athleteRegistrationId/:heat/assign-result')
  async assignResult(
    @Param('athleteRegistrationId') athleteRegistrationId: string,
    @Param('heat') heat: string,
    @Body() resultData: { position?: number; time?: string },
  ): Promise<ApiResponse<AthleteHeat>> {
    const updatedAthleteHeat = await this.athleteHeatService.assignResult(
      athleteRegistrationId,
      heat,
      resultData,
    );
    return ApiResponse.success(
      `Athlete's result assigned to heat successfully`,
      updatedAthleteHeat,
    );
  }
}
