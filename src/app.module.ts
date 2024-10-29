import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import * as Joi from 'joi';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { ConfigModule } from '@nestjs/config';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { User } from './users/entities/user.entity';
import { JwtModule } from './jwt/jwt.module';
import { JwtMiddleware } from './jwt/jwt.middleware';
import { AuthModule } from './auth/auth.module';
import { Verification } from './users/entities/verification.entity';
import { MailModule } from './mail/mail.module';
import { Category } from './restaurants/entities/category.entity';
import { Dish } from './restaurants/entities/dish.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { OrderItem } from './orders/entities/order-item.entity';
import { Context } from 'graphql-ws';
import { PaymentsModule } from './payments/payments.module';
import { Payment } from './payments/entities/payment.entity';
import { ScheduleModule } from '@nestjs/schedule';





@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath:process.env.NODE_ENV === "dev" ? ".env.dev" : ".env.test",
      ignoreEnvFile: process.env.NODE_ENV === 'prod',
      validationSchema:  Joi.object({
        NODE_ENV: Joi.string().valid('dev','prod','test').required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),
        SECRET_KEY:Joi.string().required(),
        MAILGUN_API_KEY:Joi.string().required(),
        MAILGUN_DOMAIN_NAME:Joi.string().required(),
        MAINGUN_FROM_EMAIL:Joi.string().required()
      })
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      synchronize: process.env.NODE_ENV !== 'prod',
      logging:process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
      entities:[User,Verification,Restaurant,Category,Dish,Order,OrderItem,Payment]
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      // installSubscriptionHandlers:true,
      driver:ApolloDriver,
      autoSchemaFile:true,
      context:({req,extra}) =>{
          return {token: req ? req.headers['x-jwt']:extra.token}
      },
      subscriptions:{
        'graphql-ws': {
          path:'/graphql',
          onConnect: async ({extra, connectionParams}) =>{
            (extra as any).token = connectionParams['x-jwt'];
           }
        }
      }
    }),
    ScheduleModule.forRoot(),
    JwtModule.forRoot({
      privateKey:process.env.SECRET_KEY
    }),
    MailModule.forRoot({
      apiKey:process.env.MAILGUN_API_KEY,
      domain:process.env.MAILGUN_DOMAIN_NAME,
      fromEmail:process.env.MAINGUN_FROM_EMAIL
    }),
    AuthModule,
    UsersModule,
    MailModule,
    RestaurantsModule,
    OrdersModule,
    CommonModule,
    PaymentsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
