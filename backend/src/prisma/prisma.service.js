import { PrismaClient } from '@prisma/client';

// One shared client for the whole app (the NestJS PrismaService equivalent).
export const prisma = new PrismaClient();

export async function connectPrisma() {
  await prisma.$connect();
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
