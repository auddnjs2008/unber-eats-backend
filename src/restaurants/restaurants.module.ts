import { Module } from '@nestjs/common';
import { CategoryResolver, DishResolver, RestaurantResolver } from './restaurants.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restuarants.service';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { Dish } from './entities/dish.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Restaurant, Dish , CategoryRepository])],
    providers:[RestaurantResolver,RestaurantService,CategoryRepository,CategoryResolver,DishResolver],
})
export class RestaurantsModule {}
