import {
  Controller, Get, Post, Delete, Body, Query, Request,
  UseGuards, ParseIntPipe,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  async list(@Request() req: any, @Query('category') category?: string) {
    return this.favoritesService.list(req.user.id, category);
  }

  @Post()
  async add(@Request() req: any, @Body() body: { postId: number }) {
    return this.favoritesService.add(req.user.id, body.postId);
  }

  @Delete()
  async remove(
    @Request() req: any,
    @Query('postId', ParseIntPipe) postId: number,
  ) {
    return this.favoritesService.remove(req.user.id, postId);
  }

  @Get('check')
  async check(@Request() req: any, @Query('postIds') postIds?: string) {
    const ids = postIds ? postIds.split(',').map(Number).filter(n => !isNaN(n)) : [];
    return this.favoritesService.check(req.user.id, ids);
  }
}
