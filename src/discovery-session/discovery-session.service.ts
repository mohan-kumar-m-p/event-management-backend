import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiscoverySession } from './discovery-session.entity';

@Injectable()
export class DiscoverySessionService {
  private logger = new Logger(DiscoverySessionService.name);
  s3Service: any;
  constructor(
    @InjectRepository(DiscoverySession)
    private readonly discoverySessionRepository: Repository<DiscoverySession>,
  ) {}

  async findAll(): Promise<DiscoverySession[]> {
    return this.discoverySessionRepository.find();
  }

  async findOne(id: string): Promise<DiscoverySession> {
    return this.discoverySessionRepository.findOne({ where: { id } });
  }
}
