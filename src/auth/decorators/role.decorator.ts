import { SetMetadata } from '@nestjs/common';
import { ROLE } from '@prisma/client';

export const Role = (role: ROLE) => SetMetadata('role', role);
