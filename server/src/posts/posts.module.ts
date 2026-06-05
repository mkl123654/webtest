import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  UploadController,
  SectionsController,
  PostsController,
  CommentController,
  AdminSectionsController,
  AdminPostsController,
  AdminStatsController,
} from './posts.controller';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [
    UploadController,
    SectionsController,
    PostsController,
    CommentController,
    AdminSectionsController,
    AdminPostsController,
    AdminStatsController,
  ],
  providers: [PostsService, AdminGuard],
  exports: [PostsService],
})
export class PostsModule {}
