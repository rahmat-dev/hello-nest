import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import * as bcrypt from 'bcrypt';

import { PrismaService } from 'src/prisma/prisma.service';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

function exclude<User, Key extends keyof User>(user: User, keys: Key[]): User {
  for (const key of keys) {
    delete user[key];
  }
  return user;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const isPasswordMatch =
      user.password === (await bcrypt.hash(password, user.salt));

    if (user && isPasswordMatch) {
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
      return newFile;

      //   const reader = readFile(file.path);
      //   const firstSheet = reader.Sheets[reader.SheetNames[0]];
      //   const json = utils.sheet_to_json(firstSheet);
      //   const createManyUsers = await Promise.all(
      //     json.map(async ({ name, email, password }) => {
      //       const salt = await bcrypt.genSalt();
      //       const hashedPassword = await bcrypt.hash(String(password), salt);

      //       return {
      //         name,
      //         email,
      //         password: hashedPassword,
      //         salt,
      //       };
      //     }),
      //   );

      //   await this.prisma.user.createMany({
      //     data: createManyUsers,
      //     skipDuplicates: true,
      //   });

      //   return file;
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }
}
