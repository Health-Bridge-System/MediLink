export class StaffService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  findAll({ role }) {
    return this.prisma.staff.findMany({
      where: role ? { role } : {},
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
      select: { id: true, fullName: true, role: true, specialty: true, phone: true },
    });
  }
}
