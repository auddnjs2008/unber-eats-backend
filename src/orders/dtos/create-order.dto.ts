import { Field, InputType, Int, ObjectType, PickType } from '@nestjs/graphql';
import { CoreOutput } from 'src/common/dtos/output.dto';
import { Order } from '../entities/order.entity';
import { DishOption } from 'src/restaurants/entities/dish.entity';
import { OrderItemOption } from '../entities/order-item.entity';


@InputType()
export class CreateOrderItemInput {
    @Field(type => Int)
    dishId:number;

    @Field(type => [OrderItemOption],{nullable:true})
    options?:OrderItemOption[]

}

@InputType()
export class CreateOrderInput{
    @Field(type => Int)
    restaurantId:number;


    @Field(type => [CreateOrderItemInput])
    items:CreateOrderItemInput[]

}

@ObjectType()
export class CreateOrderOutput extends CoreOutput{
    @Field(type => Int, {nullable:true})
    orderId?:number;
}