import { UseGuards } from '@nestjs/common';
import { ROLE } from '@prisma/client';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';
import { RoleGuard } from 'src/guard/role.guard';

export const JwtAuth = () => UseGuards(JwtAuthGuard);

export const Role = (role: ROLE) => UseGuards(RoleGuard(role));
