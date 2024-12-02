import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Restaurant } from '../entities/restaurant.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class MyRestaurantInput extends PickType(Restaurant,["id"]){}


@ObjectType()
export class MyRestaurantOutput extends CoreOutput{
    restaurant?:Restaurant
}