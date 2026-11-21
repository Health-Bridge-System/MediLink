export class PrescriptionsService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  create(user, { items, ...data }) {
    return this.prisma.prescription.create({
      data: { ...data, doctorId: user.staffId, items: { create: items } },
      include: { items: true },
    });
  }
}
