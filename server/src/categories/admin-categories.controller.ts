import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminGuard } from '../posts/admin.guard';

@Controller('admin/category-groups')
@UseGuards(AdminGuard)
export class AdminCategoryGroupsController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async list() {
    return this.categoriesService.findAllGroups();
  }

  @Post()
  async create(@Body() body: { key: string; label: string; sortOrder?: number }) {
    return this.categoriesService.createGroup(body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: { key?: string; label?: string; sortOrder?: number }) {
    return this.categoriesService.updateGroup(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.deleteGroup(id);
    return { message: '分组已删除' };
  }
}

@Controller('admin/categories')
@UseGuards(AdminGuard)
export class AdminCategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async list(@Query('group') group?: string) {
    return this.categoriesService.findAll(group);
  }

  @Post()
  async create(@Body() body: { key: string; label: string; icon: string; groupId: number; sortOrder?: number }) {
    return this.categoriesService.createCategory(body);
  }

  @Put(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.categoriesService.updateCategory(id, body);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.categoriesService.deleteCategory(id);
    return { message: '标签已删除' };
  }
}
