import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    // 强制设置连接字符集为 utf8mb4，防止中文乱码
    await this.$executeRaw`SET NAMES utf8mb4`;
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
