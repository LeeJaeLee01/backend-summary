import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { PRIMARY_CONNECTION, REPLICA_CONNECTION } from './database.constants';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: PRIMARY_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        name: PRIMARY_CONNECTION,
        type: 'postgres',
        host: config.get<string>('DB_PRIMARY_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'demo'),
        entities: [Order],
        synchronize: false,
        logging: config.get('DB_LOG') === 'true',
        extra: { application_name: 'nest-primary' },
      }),
    }),
    TypeOrmModule.forRootAsync({
      name: REPLICA_CONNECTION,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        name: REPLICA_CONNECTION,
        type: 'postgres',
        host: config.get<string>('DB_REPLICA_HOST', 'localhost'),
        port: config.get<number>(
          'DB_REPLICA_PORT',
          config.get<number>('DB_PORT', 5432),
        ),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'demo'),
        entities: [Order],
        synchronize: false,
        logging: config.get('DB_LOG') === 'true',
        extra: { application_name: 'nest-replica' },
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
