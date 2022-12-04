import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExcelFile, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as bcrypt from 'bcrypt';
import { Queue } from 'bull';
import { readFile, utils } from 'xlsx';

import { IMPORT_EXCEL } from 'src/constants/event.constant';
import { IMPORT_EXCEL_QUEUE } from 'src/constants/queue.constant';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ImportExcelEvent } from './events/import-excel.event';
import { UsersGateway } from './users.gateway';

function exclude<User, Key extends keyof User>(user: User, keys: Key[]): User {
  for (const key of keys) {
    delete user[key];
  }
  return user;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(IMPORT_EXCEL_QUEUE) private readonly queue: Queue,
    private readonly gateway: UsersGateway,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { name, email, password } = createUserDto;
      const salt = await bcrypt.genSalt();
      const newUser = await this.prisma.user.create({
        data: {
          name,
          email,
          password: await bcrypt.hash(password, salt),
          salt,
        },
      });

      return exclude(newUser, ['salt', 'password']);
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Email has already registered');
      }

      throw new InternalServerErrorException(e);
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map((user) => exclude(user, ['salt', 'password']));
  }

  async findById(id: string, unauthorized?: boolean): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user && unauthorized) throw new UnauthorizedException();
    if (!user) throw new NotFoundException('User not found');

    return exclude(user, ['salt', 'password']);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const { name } = updateUserDto;

    await this.findById(id);

    const updatedUser = await this.prisma.user.update({
      data: { name },
      where: { id },
    });
    return exclude(updatedUser, ['salt', 'password']);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.user.delete({ where: { id } });
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user && user?.password === (await bcrypt.hash(password, user?.salt))) {
      return user;
    }

    return null;
  }

  async importExcelFile(
    file: Express.Multer.File,
    uploaderId: string,
  ): Promise<void | object> {
    try {
      if (!file) throw new BadRequestException('File is required');

      const { originalname, filename, path, mimetype } = file;
      const newFile = await this.prisma.excelFile.create({
        data: {
          original_filename: originalname,
          filename,
          path,
          mimetype,
          uploader_id: uploaderId,
        },
      });

      //   await this.queue.add(newFile);

      const importExcelEvent: ImportExcelEvent = new ImportExcelEvent();
      importExcelEvent.file = newFile;
      this.eventEmitter.emit(IMPORT_EXCEL.UPLOADED, importExcelEvent);

      return newFile;
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  async bulkInsertUsers(file: ExcelFile): Promise<void> {
    try {
      const { id, path } = file;
      const reader = readFile(path);
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

        let percentages = ((i + chunkSize) / jsonUsers.length) * 100;
        percentages = percentages > 100 ? 100 : Math.floor(percentages);
        this.gateway.server.emit('import-users-progress', { percentages });
        this.logger.debug(`File #${id}: ${percentages}%`);
      }
    } catch (e) {
      this.logger.error(e.message);
    }
  }
}
