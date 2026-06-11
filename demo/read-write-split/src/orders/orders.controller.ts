import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { CreateOrderDto, ReadSource } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /**
   * WRITE → Primary
   * POST /orders { "userId": 1, "total": 99.9, "note": "demo" }
   */
  @Post()
  create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  /**
   * READ → Replica (default)
   * GET /orders
   * GET /orders?source=primary  — read-your-writes
   */
  @Get()
  findAll(
    @Query('source') source?: ReadSource,
    @Query('limit') limit?: number,
  ) {
    const readSource: ReadSource = source === 'primary' ? 'primary' : 'replica';
    return this.ordersService.findAll(readSource, limit ?? 20);
  }

  @Get('count/compare')
  compareCounts() {
    return Promise.all([
      this.ordersService.countBySource('primary'),
      this.ordersService.countBySource('replica'),
    ]).then(([primaryCount, replicaCount]) => ({
      primaryCount,
      replicaCount,
      inSync: primaryCount === replicaCount,
      diff: primaryCount - replicaCount,
    }));
  }

  /**
   * Demo lag: tạo order rồi đọc từ primary vs replica
   * POST /orders/demo/read-after-write
   */
  @Post('demo/read-after-write')
  demoReadAfterWrite(@Body() dto: CreateOrderDto) {
    return this.ordersService.createAndCompareRead(dto);
  }

  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Query('source') source?: ReadSource,
  ) {
    const readSource: ReadSource = source === 'primary' ? 'primary' : 'replica';
    return this.ordersService.findOne(id, readSource);
  }
}
