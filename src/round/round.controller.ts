import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoundService } from './round.service';

@UseGuards(AuthGuard('jwt'))
@Controller('round')
export class RoundController {
  constructor(private readonly roundService: RoundService) {}
}
