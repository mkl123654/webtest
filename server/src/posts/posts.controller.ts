import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { AdminGuard } from './admin.guard';

// ===== 公开接口（Web 前端使用）=====

@Controller('sections')
export class SectionsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async list(@Query('category') category?: string) {
    return this.postsService.findAllSections(category);
  }
}

@Controller('posts')
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async list(
    @Query('category') category?: string,
    @Query('published') published?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.postsService.findAllPosts({
      category,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      sectionId: sectionId ? parseInt(sectionId) : undefined,
    });
  }

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findPostById(id);
  }
}

// ===== 管理员接口 =====

@Controller('admin/sections')
@UseGuards(AdminGuard)
export class AdminSectionsController {
  constructor(private postsService: PostsService) {}

  @Post()
  async create(@Body() body: { title: string; category: string; sortOrder?: number }) {
    return this.postsService.createSection(body);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { title?: string; category?: string; sortOrder?: number },
  ) {
    return this.postsService.updateSection(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.postsService.deleteSection(id);
    return { message: '栏目已删除' };
  }
}

@Controller('admin/posts')
@UseGuards(AdminGuard)
export class AdminPostsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async list(
    @Query('category') category?: string,
    @Query('published') published?: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.postsService.findAllPosts({
      category,
      published: published === 'true' ? true : published === 'false' ? false : undefined,
      sectionId: sectionId ? parseInt(sectionId) : undefined,
    });
  }

  @Post()
  async create(
    @Body()
    body: {
      title: string;
      description: string;
      emoji: string;
      badge: string;
      sectionId: number;
      published?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.postsService.createPost(body);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body()
    body: {
      title?: string;
      description?: string;
      emoji?: string;
      badge?: string;
      sectionId?: number;
      published?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.postsService.updatePost(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.postsService.deletePost(id);
    return { message: '卡片已删除' };
  }

  @Patch(':id/toggle')
  async togglePublish(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.togglePublish(id);
  }
}

@Controller('admin/stats')
@UseGuards(AdminGuard)
export class AdminStatsController {
  constructor(private postsService: PostsService) {}

  @Get()
  async get() {
    return this.postsService.getStats();
  }
}
