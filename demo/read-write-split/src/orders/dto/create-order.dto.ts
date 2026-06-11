import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  userId!: number;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsString()
  note?: string;
}

export type ReadSource = 'replica' | 'primary';
