import { Field, ObjectType } from '@nestjs/graphql';
import { Column, Entity } from 'typeorm';


@ObjectType() // GraphQl 스키마
@Entity() // DB에 저장되는 실제 데이터 형식
export class Restaurant {

    @Field(type => String)
    @Column()
    name:string;
    
    @Field(type => Boolean, {nullable:true})
    @Column()
    isVegan: boolean;

    @Field(type => String)
    @Column()
    address:string;

    @Field(type => String)
    @Column()
    ownerName: string;

}