import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  PRIMARY_CONNECTION,
  REPLICA_CONNECTION,
} from '../database/database.constants';
import { Order } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order], PRIMARY_CONNECTION),
    TypeOrmModule.forFeature([Order], REPLICA_CONNECTION),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
