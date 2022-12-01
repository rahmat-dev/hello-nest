import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ROLE, User } from '@prisma/client';
import { Request } from 'express';

import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

import { AuthService } from './auth.service';
import { Role } from './decorators/role.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto): Promise<any> {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request): User {
    const user = req.user as User;
    return user;
  }

  @Role(ROLE.ADMIN)
  @Get('admin')
  onlyForAdmin(@Req() req: Request): User {
    const user = req.user as User;
    return user;
  }
}
