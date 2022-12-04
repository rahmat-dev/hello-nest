import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
// import { PrismaService } from './common/services/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
    },
  });

  //   const prismaService = app.get(PrismaService);
  //   await prismaService.enableShutdownHooks(app);

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
