import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';

import { IMPORT_EXCEL_QUEUE } from 'src/constants/queue.constant';
import { UsersService } from '../users.service';

@Processor(IMPORT_EXCEL_QUEUE)
export class ImportExcelProcessor {
  constructor(private readonly usersService: UsersService) {}

  @Process()
  async bulkInsertUsers(job: Job) {
    await this.usersService.bulkInsertUsers(job.data);
  }
}
