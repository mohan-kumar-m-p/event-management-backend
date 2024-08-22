import { Controller, Get } from '@nestjs/common';

@Controller('/')
export class WildcardController {
  @Get()
  handleWildcard() {
    return 'Wildcard route handled';
  }
}
