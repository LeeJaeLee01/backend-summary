import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Route bỏ qua auth (login, health) */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
