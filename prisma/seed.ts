import { PrismaClient, ROLE } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt();
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ngantree.com' },
    create: {
      email: 'admin@ngantree.com',
      name: 'Admin',
      salt,
      password: await bcrypt.hash('password', salt),
      role: ROLE.ADMIN,
    },
    update: {},
  });
  console.log({ admin });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
