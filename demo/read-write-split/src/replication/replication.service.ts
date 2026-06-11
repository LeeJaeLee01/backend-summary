import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PRIMARY_CONNECTION, REPLICA_CONNECTION } from '../database/database.constants';

@Injectable()
export class ReplicationService {
  constructor(
    @InjectDataSource(PRIMARY_CONNECTION)
    private readonly primary: DataSource,
    @InjectDataSource(REPLICA_CONNECTION)
    private readonly replica: DataSource,
  ) {}

  async getStatus() {
    const [replicationRows, replicaRecovery, lagSeconds] = await Promise.all([
      this.primary.query(`
        SELECT
          client_addr::text,
          application_name,
          state,
          sync_state,
          pg_size_pretty(pg_wal_lsn_diff(sent_lsn, replay_lsn)) AS wal_lag
        FROM pg_stat_replication
      `),
      this.replica.query(`SELECT pg_is_in_recovery() AS is_replica`),
      this.replica.query(`
        SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) AS lag_seconds
      `),
    ]);

    return {
      primary: { connected: this.primary.isInitialized },
      replica: {
        connected: this.replica.isInitialized,
        isStandby: replicaRecovery[0]?.is_replica ?? null,
        lagSeconds: lagSeconds[0]?.lag_seconds ?? null,
      },
      streaming: replicationRows,
      routing: {
        write: 'PRIMARY (DB_PRIMARY_HOST)',
        readDefault: 'REPLICA (DB_REPLICA_HOST)',
        readAfterWrite: 'PRIMARY (?source=primary)',
      },
    };
  }
}
