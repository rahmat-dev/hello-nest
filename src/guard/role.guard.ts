import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE, User } from '@prisma/client';
import { Request } from 'express';

import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user: User;
}

@Injectable()
export class RoleGuard extends JwtAuthGuard {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);

    const role = this.reflector.get<ROLE>('role', context.getHandler());
    if (!role) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    console.log({ user, role });
    return user?.role === role;
  }
}
