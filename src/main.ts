import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{cors:true});
  app.useGlobalPipes(
    new ValidationPipe()
  )
  // app.enableCors({
  //   allowedHeaders:['content-type'],
  //   origin:"http://localhost:5173",
  //   credentials:true
  // })
  await app.listen(4000);
}
bootstrap();
