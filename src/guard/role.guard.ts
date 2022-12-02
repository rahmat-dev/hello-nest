import { CanActivate, ExecutionContext, mixin, Type } from '@nestjs/common';
import { ROLE, User } from '@prisma/client';
import { Request } from 'express';
import { JwtAuthGuard } from './jwt-auth.guard';

interface RequestWithUser extends Request {
  user: User;
}

export const RoleGuard = (role: ROLE): Type<CanActivate> => {
  class RoleGuardMixin extends JwtAuthGuard implements CanActivate {
    async canActivate(context: ExecutionContext) {
      await super.canActivate(context);

      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const user = request.user;
      return user?.role === role;
    }
  }

  return mixin(RoleGuardMixin);
};
