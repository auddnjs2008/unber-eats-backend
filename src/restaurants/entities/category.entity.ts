import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Restaurant } from './restaurant.entity';

@InputType("CategoryInputType", {isAbstract:true})
@ObjectType() // GraphQl 스키마
@Entity() // DB에 저장되는 실제 데이터 형식
export class Category extends CoreEntity {

    @Field(type => String)
    @Column({unique:true})
    @IsString()
    @Length(5,10)
    name:string;

    @Field(type => String, { nullable: true})
    @Column({nullable:true})
    @IsString()
    coverImage:string;


    @Field(type => String)
    @Column({unique:true})
    @IsString()
    slug: string;

    @Field(type => [Restaurant])
    @OneToMany(type => Restaurant, restuarant => restuarant.category)
    restaurants: Restaurant[];
    


}