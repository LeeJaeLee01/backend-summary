import { Controller, Get } from '@nestjs/common';
import { ReplicationService } from './replication.service';

@Controller('replication')
export class ReplicationController {
  constructor(private readonly replicationService: ReplicationService) {}

  /** GET /replication/status — lag + pg_stat_replication */
  @Get('status')
  status() {
    return this.replicationService.getStatus();
  }
}
