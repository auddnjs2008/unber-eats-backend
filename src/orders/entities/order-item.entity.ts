import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish, DishChoice, DishOption } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';


@InputType("OrderItemOptionInputType", {isAbstract:true})
@ObjectType()
export class OrderItemOption {
    @Field(type => String)
    name:string;

    @Field(type => String,{nullable:true})
    choice: string
}

@InputType('OrderItemInputType', {isAbstract:true})
@ObjectType() // GraphQl 스키마
@Entity() // DB에 저장되는 실제 데이터 형식
export class OrderItem extends CoreEntity {

    @Field(type => Dish)
    @ManyToOne(type => Dish,{nullable:true,onDelete:'CASCADE'})
    dish:Dish;

    @Field(type => [OrderItemOption],{nullable:true})
    @Column({type:"json",nullable:true})
    options?: OrderItemOption[]


}