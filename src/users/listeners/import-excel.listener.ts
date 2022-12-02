import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import * as bcrypt from 'bcrypt';
import { readFile, utils } from 'xlsx';

import { IMPORT_EXCEL } from 'src/constants/event.constant';
import { PrismaService } from 'src/prisma/prisma.service';

import { ImportExcelEvent } from '../events/import-excel.event';

@Injectable()
export class ImportExcelListener {
  private readonly logger = new Logger(ImportExcelEvent.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(IMPORT_EXCEL.UPLOADED)
  async handleExcelUploadedEvent(event: ImportExcelEvent) {
    try {
      const { filepath } = event;
      const reader = readFile(filepath);
      const firstSheet = reader.Sheets[reader.SheetNames[0]];
      const jsonUsers = utils.sheet_to_json(firstSheet);
      const chunkSize = 100;

      for (let i = 0; i < jsonUsers.length; i += chunkSize) {
        const chunkUsers = [...jsonUsers].slice(i, i + chunkSize);
        const createManyUsers = await Promise.all(
          chunkUsers.map(async ({ name, email, password }) => {
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(String(password), salt);

            return {
              name,
              email: `${email}com`,
              password: hashedPassword,
              salt,
            };
          }),
        );

        await this.prisma.user.createMany({
          data: createManyUsers,
          skipDuplicates: true,
        });

        this.logger.debug(i + chunkSize);
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
