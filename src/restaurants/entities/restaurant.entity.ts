import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { User } from 'src/users/entities/user.entity';
import { Dish } from './dish.entity';
import { Order } from 'src/orders/entities/order.entity';

@InputType('RestaurantInputType', {isAbstract:true})
@ObjectType() // GraphQl 스키마
@Entity() // DB에 저장되는 실제 데이터 형식
export class Restaurant extends CoreEntity {

    @Field(type => String)
    @Column()
    @IsString()
    @Length(5,10)
    name:string;


    @Field(type => String)
    @Column()
    @IsString()
    address:string;

    @Field(type => String)
    @Column()
    @IsString()
    coverImage:string;

    @Field(type => Category,{nullable:true})
    @ManyToOne(type => Category, category => category.restaurants,{nullable:true, onDelete:'SET NULL'})
    category:Category;


    @Field(type => User,{nullable:true})
    @ManyToOne(type => User, user => user.restaurants,{nullable:true, onDelete:'CASCADE'})
    owner:User;


    @Field(type => [Order])
    @OneToMany(type => Order, order => order.restaurant)
    orders: Order[];


    @RelationId((restaurant:Restaurant) => restaurant.owner)
    ownerId:number;


    @Field(type => [Dish])
    @OneToMany(type => Dish, dish => dish.restaurant)
    menu: Dish[];

}