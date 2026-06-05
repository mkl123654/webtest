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
  UseInterceptors,
  UploadedFile,
  Request,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PostsService } from './posts.service';
import { AdminGuard } from './admin.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// ===== 图片上传 =====

@Controller('admin/upload')
@UseGuards(AdminGuard)
export class UploadController {
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (_req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, unique + extname(file.originalname));
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith('image/')) {
        cb(new BadRequestException('仅支持图片文件'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    return { url: `/uploads/${file.filename}` };
  }
}

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
    return this.postsService.findPostDetail(id);
  }

  // ===== 评论 =====

  @Get(':id/comments')
  async comments(@Param('id', ParseIntPipe) id: number) {
    return this.postsService.findPostDetail(id).then((p) => p.comments);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/comments')
  async createComment(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: { content: string; parentId?: number },
  ) {
    if (!body.content?.trim()) throw new BadRequestException('评论内容不能为空');
    return this.postsService.createComment(id, req.user.id, {
      content: body.content.trim(),
      parentId: body.parentId,
    });
  }

  // ===== 评分 =====

  @UseGuards(JwtAuthGuard)
  @Post(':id/rate')
  async rate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() body: { score: number },
  ) {
    return this.postsService.ratePost(id, req.user.id, body.score);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/rating')
  async getRating(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.postsService.getUserRating(id, req.user.id);
  }
}

@Controller('comments')
export class CommentController {
  constructor(private postsService: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    await this.postsService.deleteComment(id, req.user.id);
    return { message: '评论已删除' };
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
      content?: string;
      images?: string;
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
      content?: string;
      images?: string;
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
