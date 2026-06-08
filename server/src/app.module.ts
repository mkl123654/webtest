import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { FavoritesModule } from './favorites/favorites.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, PostsModule, FavoritesModule],
})
export class AppModule {}
