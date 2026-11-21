import { BadRequestException, NotFoundException } from '../../common/exceptions/http.exception.js';
import { assertPatientAccess } from '../../common/guards/roles.guard.js';
import { EVENTS } from '../../core/events.js';

const staffName = { select: { id: true, fullName: true } };

export const orderInclude = {
  patient: { select: { id: true, fullName: true, nationalId: true, gender: true, birthDate: true } },
  doctor: staffName,
  items: {
    include: {
      service: true,
      performer: staffName,
      labResults: true,
      cdssAlerts: true,
      imagingStudy: { include: { series: true, report: true, cdssResults: true } },
    },
  },
  diagnoses: true,
  invoice: { select: { id: true, total: true, paymentStatus: true } },
};

export class OrdersService {
  constructor({ prisma, events }) {
    this.prisma = prisma;
    this.events = events;
  }

  async findAll(user, { page, pageSize, status, patientId }) {
    const showBilling = user.role === 'ADMIN';
    const where = {
      ...(status && { status }),
      ...(user.role === 'PATIENT' ? { patientId: user.patientId } : patientId ? { patientId } : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          patient: { select: { id: true, fullName: true } },
          doctor: staffName,
          items: { include: { service: true } },
          invoice: showBilling && { select: { id: true, paymentStatus: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(user, id) {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { ...orderInclude, invoice: user.role === 'ADMIN' && orderInclude.invoice } });
    if (!order) throw new NotFoundException('Order not found');
    assertPatientAccess(user, order.patientId);
    return order;
  }

  // Lab and radiology worklists: open items of one service type, STAT first.
  async worklist({ type, status }) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        service: { type },
        status: status === 'OPEN' ? { in: ['ORDERED', 'IN_PROGRESS'] } : status,
      },
      orderBy: [{ createdAt: 'asc' }],
      include: {
        service: true,
        performer: staffName,
        labResults: true,
        cdssAlerts: true,
        imagingStudy: { include: { report: true, cdssResults: true, series: true } },
        order: { include: { patient: { select: { id: true, fullName: true, gender: true, birthDate: true } }, doctor: staffName } },
      },
      take: 100,
    });
    const rank = { STAT: 0, URGENT: 1, ROUTINE: 2 };
    return items.sort((a, b) => rank[a.order.priority] - rank[b.order.priority]);
  }

  async create(user, dto) {
    const services = await this.prisma.service.findMany({ where: { id: { in: dto.serviceIds } } });
    if (services.length !== dto.serviceIds.length) throw new BadRequestException('One of the selected tests does not exist');

    if (dto.appointmentId) {
      const appt = await this.prisma.appointment.findUnique({ where: { id: dto.appointmentId }, include: { order: true } });
      if (!appt || appt.patientId !== dto.patientId) throw new BadRequestException('That appointment belongs to another patient');
      if (appt.order) throw new BadRequestException(`This appointment already has order #${appt.order.id}`);
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          patientId: dto.patientId,
          doctorId: user.staffId,
          appointmentId: dto.appointmentId,
          priority: dto.priority,
          items: { create: dto.serviceIds.map((serviceId) => ({ serviceId })) },
        },
        include: { patient: true, doctor: true, items: { include: { service: true } } },
      });

      if (dto.diagnosis) {
        await tx.diagnosis.create({
          data: {
            patientId: dto.patientId,
            doctorId: user.staffId,
            orderId: created.id,
            icd10Code: dto.diagnosis.icd10Code,
            description: dto.diagnosis.description,
            diagnosedAt: new Date(),
          },
        });
      }

      if (dto.appointmentId) {
        await tx.appointment.update({ where: { id: dto.appointmentId }, data: { status: 'CHECKED_IN' } });
      }
      return created;
    });

    // CDSS (duplicate check) and HL7 (ORM^O01) react to this event.
    await this.events.emit(EVENTS.ORDER_PLACED, { order });
    return this.findOne(user, order.id);
  }

  async startItem(user, itemId) {
    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId }, include: { service: true } });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.status !== 'ORDERED') throw new BadRequestException(`This test is already ${item.status.toLowerCase().replace('_', ' ')}`);
    this.assertCanPerform(user, item.service.type);

    const updated = await this.prisma.orderItem.update({ where: { id: itemId }, data: { status: 'IN_PROGRESS', performedBy: user.staffId } });
    await this.refreshStatus(item.orderId);
    return updated;
  }

  async cancel(user, id) {
    const order = await this.findOne(user, id);
    if (order.status === 'COMPLETED') throw new BadRequestException('Completed orders cannot be cancelled');
    await this.prisma.orderItem.updateMany({ where: { orderId: id, status: { in: ['ORDERED', 'IN_PROGRESS'] } }, data: { status: 'CANCELLED' } });
    await this.refreshStatus(id);
    return this.prisma.order.findUnique({ where: { id } });
  }

  assertCanPerform(user, serviceType) {
    const allowed = serviceType === 'LAB' ? ['LAB_TECH'] : ['RADIOLOGIST'];
    if (!allowed.includes(user.role)) {
      throw new BadRequestException(`Only ${serviceType === 'LAB' ? 'lab technicians' : 'radiologists'} can work on this test`);
    }
  }

  // Order status follows its items. When the last one finishes, the order is
  // announced as completed (billing listens and creates the invoice).
  async refreshStatus(orderId) {
    const items = await this.prisma.orderItem.findMany({ where: { orderId } });
    const active = items.filter((i) => i.status !== 'CANCELLED');

    let status = 'ORDERED';
    if (active.length === 0) status = 'CANCELLED';
    else if (active.every((i) => i.status === 'COMPLETED')) status = 'COMPLETED';
    else if (active.some((i) => i.status !== 'ORDERED')) status = 'IN_PROGRESS';

    await this.prisma.order.update({ where: { id: orderId }, data: { status } });
    if (status === 'COMPLETED') await this.events.emit(EVENTS.ORDER_COMPLETED, { orderId });
    return status;
  }
}
