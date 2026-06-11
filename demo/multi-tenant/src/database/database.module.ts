import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantDatabaseService } from './tenant-database.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5436),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'app_db'),
        synchronize: false,
        logging: config.get('DB_LOG') === 'true',
        extra: { application_name: 'taskflow-multi-tenant' },
      }),
    }),
  ],
  providers: [TenantDatabaseService],
  exports: [TenantDatabaseService, TypeOrmModule],
})
export class DatabaseModule {}
