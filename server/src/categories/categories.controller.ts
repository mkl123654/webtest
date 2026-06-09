import { Controller, Get, Query } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  async list(@Query('group') group?: string) {
    return this.categoriesService.findAllGroups(group);
  }
}
