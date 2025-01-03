import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { ILike, Like, Repository } from 'typeorm';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { SearchRestaurantInput, SearchRestaurantOutput } from './dtos/search-restaurant.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import { Dish } from './entities/dish.entity';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import { MyRestaurantsOutput } from './dtos/my-restaurants';
import { MyRestaurantInput, MyRestaurantOutput } from './dtos/my-restaurant';

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant) 
        private readonly restaurants:Repository<Restaurant>,
        @InjectRepository(Dish) 
        private readonly dishes:Repository<Dish>,
        private readonly categories: CategoryRepository
    ){}

    async createRestaurant(owner:User, createRestaurantInput:CreateRestaurantInput):Promise<CreateRestaurantOutput> {
       try{
        const newRestuarant = this.restaurants.create(createRestaurantInput);
        newRestuarant.owner = owner;
        const category = await this.categories.getOrCreate(createRestaurantInput.categoryName);
        newRestuarant.category = category;
        await  this.restaurants.save(newRestuarant);
        return {
            ok:true,
            restaurantId:newRestuarant.id,
        }
       }catch{
             return {
                ok:false,
                error: 'Could not create restaurant'
             }
       }
    }

    async myRestaurants(owner:User):Promise<MyRestaurantsOutput>{
        try{
            const restaurants = await this.restaurants.find({where:{owner:{id:owner.id}}});        
            console.log(restaurants[0]);
        
            return {
                restaurants,
                ok:true
            } 
        }catch(error){
            console.log(error,'error');
            return {
                ok:false,
                error:'Could not GET Restaurant'
            }
        }


    }

    async myRestaurant(owner:User, myRestaurant:MyRestaurantInput):Promise<MyRestaurantOutput>{
        try{
          const restaurant = await this.restaurants.findOne({where:{id:myRestaurant.id,owner:{id:owner.id}},relations:['menu','orders']});
          console.log(restaurant,'restaurant');
          return {
            ok:true,
            restaurant,
          }


        }catch{
            return {
                ok:false,
                error:'Could not GET Restaurant'
            }

        }
    }

    async editRestaurant(owner:User,editRestaurantInput:EditRestaurantInput):Promise<EditRestaurantOutput>{
        try{
            const restaurant = await this.restaurants.findOne({where:{id:editRestaurantInput.restaurantId}});
            if(!restaurant){
                return {
                    ok:false,
                    error:'Restuarant not found'
                }
            }
            if(owner.id !== restaurant.ownerId){
                return {
                    ok:false,
                    error:'You cant edit a restaurant that you dont own'
                }
            }

            let category:Category = null;
            if(editRestaurantInput.categoryName){
                category = await this.categories.getOrCreate(editRestaurantInput.categoryName);
            }
            await this.restaurants.save([{
                id:editRestaurantInput.restaurantId,
                ...editRestaurantInput,
                ...(category && {category})
            }])

            return {
                ok:true
            } 
        }catch(e){
            console.log(e);
            return {
                ok:false,
                error:'Could not Edit Restaurant'
            }
        }
    }

    async deleteRestaurant(owner:User,{restaurantId}:DeleteRestaurantInput):Promise<DeleteRestaurantOutput>{
       try{
        const restaurant = await this.restaurants.findOne({where:{id:restaurantId}});
        if(!restaurant){
            return {
                ok:false,
                error:'Restuarant not found'
            }
        }
        if(owner.id !== restaurant.ownerId){
            return {
                ok:false,
                error:'You cant delete a restaurant that you dont own'
            }
        }
        await this.restaurants.delete(restaurantId)
        return {
            ok:true
        }
       }catch{
        return {
            ok:false,
            error:'Could not delete Restaurant'
        }
       }
    }



    async allCategories():Promise<AllCategoriesOutput> {
        try{
            const categories  = await this.categories.find();
            return {
                ok:true,
                categories
            }
        }catch{
            return {
                ok:false,
                error: 'Could not load categories'
            }
        }
    }

    countRestaurants(category:Category){
        return this.restaurants.count({where:{category:{id:category.id}}});
    }

    async findCategoryBySlug({slug,page}:CategoryInput):Promise<CategoryOutput>{
        try{
            const category = await this.categories.findOne({where:{slug}},);
            if(!category){
                return {
                    ok:false,
                    error:'Category not found'
                }
            }

            const restaurants = await this.restaurants.find({
                where:{
                    category:{
                        id:category.id,
                    },
                },
                take:3,
                skip: (page-1)*3,
                order:{
                    isPromoted:'DESC',
                 } 
            })
            category.restaurants = restaurants;
            const totalResults =await this.countRestaurants(category)
            return {
                ok:true,
                category,
                totalPages: Math.ceil(totalResults / 3),
                restaurants

            }


        }catch{
            return {
                ok:false,
                error:'Could not find Category'
            }
        }
    }

    async allRestaurants({page}:RestaurantsInput):Promise<RestaurantsOutput>{
        try{
            const [restaurants,totalResult] = await this.restaurants.findAndCount(
                {skip:(page-1)*3,
                 take:3,
                 order:{
                    isPromoted:'DESC',
                 }   
                });
        
            return {
                ok:true,
                results:restaurants,
                totalPages:Math.ceil(totalResult/3),
                totalResult
            }
        }catch{
            return {
                ok:false,
                error:'Could not load restaurants'
            }
        }

    }

    async findRestaurantById({restaurantId}:RestaurantInput):Promise<RestaurantOutput>{
        try{
            const restaurant = await this.restaurants.findOne({where:{id:restaurantId},relations:['menu']});
           if(!restaurant){
            return {
                ok:false,
                error:'Restaurant not found'
            }
           }
            return {
                ok:true,
                restaurant
            }


        }catch{
            return{
                ok:false,
                error:'Could not find restaurant'
            }
        }

    }

    async searchRestaurantByName({query,page}:SearchRestaurantInput):Promise<SearchRestaurantOutput>{
        try{

            const [restaurants,totalResults] = await this.restaurants.findAndCount(
                {
                    where: {
                        name:ILike(`%${query}%`)
                    },
                    skip: (page-1) * 3,
                    take:3
                }
            );
            return{
                ok:true,
                restaurants,
                totalResult:totalResults,
                totalPages:Math.ceil(totalResults/25)
            }

        }catch{
            return {
                ok:false,
                error:'Could not search for restaurants'
            }
        }

    }

    async createDish(owner:User,createDishInput:CreateDishInput):Promise<CreateDishOutput>{
        try{
            const restaurant = await this.restaurants.findOne({where:{id:createDishInput.restaurantId}});
            if(!restaurant){
                return {
                    ok:false,
                    error:'Restaurant not found'
                }
            }
            if(owner.id !== restaurant.ownerId){
                return {
                    ok:false,
                    error:'You cant do that'
                }
            }
             await this.dishes.save(this.dishes.create({...createDishInput, restaurant}));
            return {
                ok:true
            }
        }catch(error){
            console.log(error)
            return {
                ok:false,
                error: 'Could not create dish'
            }
        }      
    }

    async editDish(owner:User,editDishInput:EditDishInput):Promise<EditDishOutput>{
        try{
            const dish = await this.dishes.findOne({where:{id:editDishInput.dishId},relations:['restaurant']});
            if(!dish){
                return {
                    ok:false,
                    error:'Dish not found'
                }
            }
            if(dish.restaurant.ownerId !== owner.id){
                return {
                    ok:false,
                    error:'You cant do that'
                }
            }
            await this.dishes.save([{
                id:editDishInput.dishId,
                ...editDishInput
            }])
            return{
                ok:true
            }
           }catch{
            return {
                ok:false,
                error:'Could not delete dish'
            }
           }     
    }

    async deleteDish(owner:User,{dishId}:DeleteDishInput):Promise<DeleteDishOutput>{
       try{
        const dish = await this.dishes.findOne({where:{id:dishId},relations:['restaurant']});
        if(!dish){
            return {
                ok:false,
                error:'Dish not found'
            }
        }
        if(dish.restaurant.ownerId !== owner.id){
            return {
                ok:false,
                error:'You cant do that'
            }
        }
        await this.dishes.delete(dishId);
        return {
            ok:true,

        }
       }catch{
        return {
            ok:false,
            error:'Could not delete dish'
        }
       }
    }


}
