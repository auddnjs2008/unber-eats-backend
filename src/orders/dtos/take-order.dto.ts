import { InputType, ObjectType, PickType } from '@nestjs/graphql';
import { Order } from '../entities/order.entity';
import { CoreOutput } from 'src/common/dtos/output.dto';

@InputType()
export class TakeOrderInput extends PickType(Order,['id']){}


@ObjectType()
export class TakeOrderOutput extends CoreOutput {}