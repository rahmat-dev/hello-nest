import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';

import { LoginDto } from './dto/login.dto';

interface LoginResponse {
  access_token: string;
}

export interface JwtPayload {
  sub: string;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    const user = await this.usersService.validateUser(email, password);
    if (!user) throw new BadRequestException('Incorrect email or password');

    const accessToken = await this.generateAccessToken(user);
    return { access_token: accessToken };
  }

  async generateAccessToken(user: User): Promise<string> {
    const { id, name } = user;
    const payload: JwtPayload = { sub: id, name };
    const accessToken = await this.jwtService.signAsync(payload);
    return accessToken;
  }
}
