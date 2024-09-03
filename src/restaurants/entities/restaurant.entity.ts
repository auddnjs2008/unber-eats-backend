import { Field, Int, ObjectType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@ObjectType() // GraphQl 스키마
@Entity() // DB에 저장되는 실제 데이터 형식
export class Restaurant {

    @PrimaryGeneratedColumn()
    @Field(type => Number)
    id:number;

    @Field(type => String)
    @Column()
    @IsString()
    @Length(5,10)
    name:string;
    
    @Field(type => Boolean, {nullable:true})
    @Column({default:true})
    @IsOptional()
    @IsBoolean()
    isVegan: boolean;

    @Field(type => String)
    @Column()
    @IsString()
    address:string;

    @Field(type => String)
    @Column()
    @IsString()
    ownerName: string;

    @Field(type=> String)
    @Column()
    @IsString()
    categoryName:string;

}