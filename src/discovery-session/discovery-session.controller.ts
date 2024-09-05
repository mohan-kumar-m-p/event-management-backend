import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponse } from 'src/shared/dto/api-response.dto';
import { DiscoverySessionService } from './discovery-session.service';

@UseGuards(AuthGuard('jwt'))
@Controller('discovery-session')
export class DiscoverySessionController {
  constructor(
    private readonly discoverySessionService: DiscoverySessionService,
  ) {}

  @Get()
  async findAll(): Promise<ApiResponse<any>> {
    const discoverySessions = await this.discoverySessionService.findAll();
    return ApiResponse.success(
      'Discovery sessions fetched successfully',
      discoverySessions,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<any>> {
    const discoverySession = await this.discoverySessionService.findOne(id);
    return ApiResponse.success(
      'Discovery session fetched successfully',
      discoverySession,
    );
  }
}
