import { Field, InputType, ObjectType, registerEnumType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { InternalServerErrorException } from '@nestjs/common';
import { IsBoolean, IsEmail, IsEnum, IsString } from 'class-validator';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { Order } from 'src/orders/entities/order.entity';
import { Payment } from 'src/payments/entities/payment.entity';


export enum UserRole {
    Owner='Owner',
    Client='Client',
    Delivery='Delivery'
}

registerEnumType(UserRole, {name:'UserRole'});

@InputType('UserInputType',{isAbstract:true})
@ObjectType()
@Entity()
export class User extends CoreEntity {

    @Column({unique:true})
    @Field(type => String)
    @IsString()
    @IsEmail()
    email:string;

    @Column({select:false})
    @Field(type => String)
    @IsString()
    password:string;

    @Column(
        {type:'enum', enum:UserRole}
    )
    @Field(type => UserRole)
    @IsEnum(UserRole)
    role: UserRole;

    @Column({default:false})
    @Field(type => Boolean)
    @IsBoolean()
    verified:Boolean;

    @Field(type => [Restaurant])
    @OneToMany(type => Restaurant, restuarant => restuarant.owner)
    restaurants: Restaurant[];


    @Field(type => [Order])
    @OneToMany(type => Order, order => order.customer)
    orders: Order[];


    @Field(type => [Payment])
    @OneToMany(type => Payment , payment => payment.user)
    payments: Payment[];


    @Field(type => [Order])
    @OneToMany(type => Order, order => order.driver)
    rides: Order[];


    @BeforeInsert()
    @BeforeUpdate()
    async hashPassword():Promise<void>{
        if(this.password){
            try{
                this.password = await bcrypt.hash(this.password,10);
        
            }catch(e){
                    console.log(e);
                    throw new InternalServerErrorException()
            }
        }
    }

    async checkPassword(aPassword:string):Promise<boolean>{
        try{
          const ok =await bcrypt.compare(aPassword,this.password);
          return ok;
        }catch(e){
            console.log(e);
            throw new InternalServerErrorException()
        }
    }

}