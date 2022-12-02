import { ExcelFile } from '@prisma/client';

export class ImportExcelEvent {
  file: ExcelFile;
}
