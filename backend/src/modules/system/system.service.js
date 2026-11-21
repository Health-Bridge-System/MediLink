export class SystemService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', database: 'mysql', time: new Date().toISOString() };
  }
}
