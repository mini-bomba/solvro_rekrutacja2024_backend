import { Module } from '@nestjs/common';
import { CoctailsController } from './coctails.controller';
import { DBService } from './db.service';
import { CoctailsService } from './coctails.service';
import { IngredientsService } from './ingredients.service';
import { CategoriesService } from './categories.service';
import { IngredientsController } from './ingredients.controller';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [],
  controllers: [
    CategoriesController,
    IngredientsController,
    CoctailsController,
  ],
  providers: [
    DBService,
    CoctailsService,
    IngredientsService,
    CategoriesService,
  ],
})
export class MainModule {}
