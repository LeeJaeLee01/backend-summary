import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { OrdersModule } from './orders/orders.module';
import { ReplicationModule } from './replication/replication.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    OrdersModule,
    ReplicationModule,
  ],
})
export class AppModule {}
