import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { AppModule } from './app.module';

async function bootstrap() {
  // 确保 uploads 目录存在
  if (!existsSync('./uploads')) mkdirSync('./uploads');

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3005'],
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // 静态文件服务 —— 上传的图片通过 /uploads/filename 访问
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Server running on http://localhost:${port}`);
}

bootstrap();
