import { OrganizerService } from './organizer.service';
import { Controller, Get } from '@nestjs/common';
import { ApiResponse } from 'src/shared/dto/api-response.dto';

@Controller('organizer')
export class OrganizerController {
  constructor(private organizerService: OrganizerService) {}

  @Get('metrics')
  async getAllMetrics() {
    const metrics = await this.organizerService.getAllMetrics();
    return ApiResponse.success('Metrics fetched successfully', metrics);
  }
}
