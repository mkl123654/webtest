import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  SectionsController,
  PostsController,
  AdminSectionsController,
  AdminPostsController,
  AdminStatsController,
} from './posts.controller';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [
    SectionsController,
    PostsController,
    AdminSectionsController,
    AdminPostsController,
    AdminStatsController,
  ],
  providers: [PostsService, AdminGuard],
  exports: [PostsService],
})
export class PostsModule {}
