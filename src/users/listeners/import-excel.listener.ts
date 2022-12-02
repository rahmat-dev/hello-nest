import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { IMPORT_EXCEL } from 'src/constants/event.constant';

import { ImportExcelEvent } from '../events/import-excel.event';
import { UsersService } from '../users.service';

@Injectable()
export class ImportExcelListener {
  constructor(private readonly usersService: UsersService) {}

  @OnEvent(IMPORT_EXCEL.UPLOADED)
  async handleExcelUploadedEvent(event: ImportExcelEvent): Promise<void> {
    await this.usersService.bulkInsertUsers(event.file);
  }
}
