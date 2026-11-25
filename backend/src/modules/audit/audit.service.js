export class AuditService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  // Never let a failed audit write break the user's request.
  async log({ userId, action, tableName, recordId = null }) {
    try {
      await this.prisma.auditLog.create({ data: { userId: userId ?? null, action, tableName, recordId } });
    } catch (err) {
      console.warn('audit log failed:', err.message);
    }
  }

  async findAll({ page, pageSize, tableName }) {
    const where = tableName ? { tableName } : {};
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { loggedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { user: { select: { username: true, role: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }
}
