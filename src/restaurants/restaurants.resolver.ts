import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { RestaurantService } from './restuarants.service';


@Resolver(of => Restaurant)
export class RestaurantResolver {
   
   constructor(private readonly restaurantService:RestaurantService){

   }

   @Query(returns => [Restaurant])
   restuarants():Promise<Restaurant[]>{
    return this.restaurantService.getAll();
   }

   @Mutation(returns => Boolean)
   async createRestaurant(
    @Args('input') createRestaurantDto: CreateRestaurantDto
   ):Promise<boolean> {
      try{
         await this.restaurantService.createRestaurant(createRestaurantDto);
         return true;
      }catch(e){
         console.log(e);
         return false;
      }
   }
}