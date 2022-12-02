import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { PrismaService } from 'src/prisma/prisma.service';
import { IMPORT_EXCEL_QUEUE } from 'src/constants/queue.constant';

import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ImportExcelListener } from './listeners/import-excel.listener';
import { ImportExcelProcessor } from './processors/import-excel.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: IMPORT_EXCEL_QUEUE,
    }),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    PrismaService,
    ImportExcelListener,
    ImportExcelProcessor,
  ],
  exports: [UsersService],
})
export class UsersModule {}
