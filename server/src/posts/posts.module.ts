import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import {
  UploadController,
  SearchController,
  PostsController,
  CommentController,
  AdminPostsController,
  AdminStatsController,
} from './posts.controller';
import { AdminGuard } from './admin.guard';

@Module({
  controllers: [
    UploadController,
    SearchController,
    PostsController,
    CommentController,
    AdminPostsController,
    AdminStatsController,
  ],
  providers: [PostsService, AdminGuard],
  exports: [PostsService],
})
export class PostsModule {}
