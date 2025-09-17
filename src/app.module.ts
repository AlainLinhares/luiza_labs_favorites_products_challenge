import { Module } from '@nestjs/common';
import { ClientsModule } from './modules/clients/clients.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ProductsModule } from './modules/products/products.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ClientsModule, FavoritesModule, ProductsModule, AuthModule]
})
export class AppModule { }
