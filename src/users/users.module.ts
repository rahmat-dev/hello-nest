import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ImportExcelListener } from './listeners/import-excel.listener';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, ImportExcelListener],
  exports: [UsersService],
})
export class UsersModule {}
