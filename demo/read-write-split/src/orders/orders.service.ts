import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PRIMARY_CONNECTION,
  REPLICA_CONNECTION,
} from '../database/database.constants';
import { CreateOrderDto, ReadSource } from './dto/create-order.dto';
import { Order } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order, PRIMARY_CONNECTION)
    private readonly primaryRepo: Repository<Order>,
    @InjectRepository(Order, REPLICA_CONNECTION)
    private readonly replicaRepo: Repository<Order>,
  ) {}

  /** WRITE — luôn primary */
  async create(dto: CreateOrderDto): Promise<Order> {
    const order = this.primaryRepo.create({
      userId: dto.userId,
      total: dto.total.toFixed(2),
      status: 'pending',
      note: dto.note ?? null,
    });
    return this.primaryRepo.save(order);
  }

  /** READ — mặc định replica; primary khi cần read-your-writes */
  async findAll(source: ReadSource = 'replica', limit = 20): Promise<Order[]> {
    const repo = source === 'primary' ? this.primaryRepo : this.replicaRepo;
    return repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findOne(id: number, source: ReadSource = 'replica'): Promise<Order | null> {
    const repo = source === 'primary' ? this.primaryRepo : this.replicaRepo;
    return repo.findOne({ where: { id } });
  }

  /** Demo read-your-writes: create rồi đọc từ primary vs replica */
  async createAndCompareRead(dto: CreateOrderDto) {
    const created = await this.create(dto);
    const [fromPrimary, fromReplica] = await Promise.all([
      this.findOne(created.id, 'primary'),
      this.findOne(created.id, 'replica'),
    ]);
    return {
      created,
      readFromPrimary: fromPrimary,
      readFromReplica: fromReplica,
      replicaHasRow: fromReplica !== null,
      hint: fromReplica
        ? 'Replica đã sync — lag rất thấp'
        : 'Replica chưa thấy row — replication lag hoặc replica chưa sẵn sàng',
    };
  }

  async countBySource(source: ReadSource): Promise<number> {
    const repo = source === 'primary' ? this.primaryRepo : this.replicaRepo;
    return repo.count();
  }
}
