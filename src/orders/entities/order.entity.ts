import { Field, Float, InputType, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { OrderItem } from './order-item.entity';
import { IsEnum, IsNumber } from 'class-validator';


export enum OrderStatus {
    Pending = "Pending",
    Cooking = "Cooking",
    Cooked = "Cooked",
    PickedUp = "PickedUp",
    Delivered = "Delivered"
}

registerEnumType(OrderStatus, {name:"OrderStatus"});

@InputType('OrderInputType', {isAbstract:true})
@ObjectType() // GraphQl 스키마
@Entity() // DB에 저장되는 실제 데이터 형식
export class Order extends CoreEntity {

    @Field(type => User,{nullable:true})
    @ManyToOne(type => User, user => user.orders,{nullable:true, onDelete:'SET NULL',eager:true})
    customer?:User

    @RelationId((order:Order) => order.customer)
    customerId:number;
    
    @Field(type => User,{nullable:true})
    @ManyToOne(type => User, user => user.rides,{nullable:true, onDelete:'SET NULL',eager:true})
    driver?:User

    @RelationId((order:Order) => order.driver)
    driverId:number;

    @Field(type => Restaurant,{nullable:true})
    @ManyToOne(type => Restaurant, restaurant => restaurant.orders,{nullable:true, onDelete:'SET NULL',eager:true})
    restaurant?:Restaurant

    @Field(type => [OrderItem])
    @ManyToMany(type => OrderItem,{eager:true})
    @JoinTable()
    items:OrderItem[]

    @Column({nullable:true})
    @Field(type => Float,{nullable:true})
    @IsNumber()
    total?: number

    @Column({type:"enum",enum:OrderStatus, default:OrderStatus.Pending})
    @Field(type => OrderStatus)
    @IsEnum(OrderStatus)
    status: OrderStatus


}