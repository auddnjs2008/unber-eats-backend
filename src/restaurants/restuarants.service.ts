import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { Repository } from 'typeorm';
import { CreateRestaurantInput, CreateRestaurantOutput } from './dtos/create-restaurant.dto';
import { User } from 'src/users/entities/user.entity';
import { EditRestaurantInput, EditRestaurantOutput } from './dtos/edit-restaurant.dto';
import { CategoryRepository } from './repositories/category.repository';
import { Category } from './entities/category.entity';
import { DeleteRestaurantInput, DeleteRestaurantOutput } from './dtos/delete-restaurant.dto';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';

@Injectable()
export class RestaurantService {
    constructor(
        @InjectRepository(Restaurant) 
        private readonly restaurants:Repository<Restaurant>,
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
        }
       }catch{
             return {
                ok:false,
                error: 'Could not create restaurant'
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

    async findCategoryBySlug({slug}:CategoryInput):Promise<CategoryOutput>{
        try{
            const category = await this.categories.findOne({where:{slug}});
            if(!category){
                return {
                    ok:false,
                    error:'Category not found'
                }
            }

            return {
                ok:true,
                category
            }


        }catch{
            return {
                ok:false,
                error:'Could not find Category'
            }
        }
    }
}
