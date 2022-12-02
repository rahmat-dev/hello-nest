import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import { ROLE, User } from '@prisma/client';
import { Request } from 'express';

import { JwtAuth, Role } from 'src/decorators/auth.decorator';

import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @Get('profile')
  @JwtAuth()
  getProfile(@Req() req: Request): User {
    const user = req.user as User;
    return user;
  }

  @Get('admin')
  @Role(ROLE.ADMIN)
  onlyForAdmin(@Req() req: Request): User {
    const user = req.user as User;
    return user;
  }
}
