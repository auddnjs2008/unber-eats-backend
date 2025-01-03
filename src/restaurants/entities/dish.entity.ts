import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, In, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';


@InputType('DishChoiceInputType',{isAbstract:true})
@ObjectType()
export class DishChoice{
    @Field(type => String)
    name:string;
    @Field(type => Int, {nullable:true})
    extra?:number;
}


@InputType("DishOptionInputType", {isAbstract:true})
@ObjectType()
export class DishOption {
    @Field(type => String)
    name:string;

    @Field(type => [DishChoice],{nullable:true})
    choices?: DishChoice[]

    @Field(type => Int, {nullable:true})
    extra?:number
}


@InputType("DishInputType", {isAbstract:true})
@ObjectType() // GraphQl 스키마
@Entity() // DB에 저장되는 실제 데이터 형식
export class Dish extends CoreEntity {

    @Field(type => String)
    @Column()
    @IsString()
    name:string;


    @Field(type => Int)
    @Column()
    @IsNumber()
    price : number;

    @Field(type => String,{nullable:true})
    @Column({nullable:true})
    @IsString()
    photo:string;

    @Field(type => String)
    @Column()
    @Length(5,140)
    description : string;


    @Field(type => Restaurant,{nullable:true})
    @ManyToOne(type => Restaurant, restaurant => restaurant.menu,{ onDelete:'CASCADE',nullable:false})
    restaurant:Restaurant;

    @RelationId((dish:Dish) => dish.restaurant)
    restaurantId:number;

    @Field(type => [DishOption],{nullable:true})
    @Column({type:"json",nullable:true})
    options?: DishOption[]

}