import { BadRequestException } from '../../common/exceptions/http.exception.js';

export class DiagnosesService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  async create(user, dto) {
    if (dto.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
      if (!order || order.patientId !== dto.patientId) throw new BadRequestException('That order belongs to another patient');
    }
    return this.prisma.diagnosis.create({ data: { ...dto, doctorId: user.staffId } });
  }
}
