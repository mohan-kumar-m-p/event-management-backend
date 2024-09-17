import { OrganizerService } from './organizer.service';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from '../shared/dto/api-response.dto';

@UseGuards(AuthGuard('jwt'))
@Controller('organizer')
export class OrganizerController {
  constructor(private organizerService: OrganizerService) {}

  @Get('metrics')
  async getAllMetrics() {
    const metrics = await this.organizerService.getAllMetrics();
    return ApiResponse.success('Metrics fetched successfully', metrics);
  }
}
