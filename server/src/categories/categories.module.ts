import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { AdminCategoryGroupsController, AdminCategoriesController } from './admin-categories.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CategoriesController, AdminCategoryGroupsController, AdminCategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
