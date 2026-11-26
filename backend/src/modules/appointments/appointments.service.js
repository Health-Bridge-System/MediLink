import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '../../common/exceptions/http.exception.js';
import { EVENTS } from '../../core/events.js';

const SLOT_MINUTES = 30;

const include = {
  patient: { select: { id: true, fullName: true } },
  staff: { select: { id: true, fullName: true, role: true } },
  service: true,
  order: { select: { id: true, status: true } },
};

export class AppointmentsService {
  constructor({ prisma, events }) {
    this.prisma = prisma;
    this.events = events;
  }

  async findAll(user, { page, pageSize, status, patientId, upcoming }) {
    const where = {
      ...(status && { status }),
      ...(upcoming && { dateTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      ...(user.role === 'PATIENT' ? { patientId: user.patientId } : patientId ? { patientId } : {}),
      // A doctor sees only the visits booked with them; the front desk and admin see all.
      ...(user.role === 'DOCTOR' && { staffId: user.staffId }),
    };
    const [items, total] = await Promise.all([
      this.prisma.appointment.findMany({
        where,
        orderBy: { dateTime: upcoming ? 'asc' : 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include,
      }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async create(user, dto) {
    const patientId = user.role === 'PATIENT' ? user.patientId : dto.patientId;
    if (!patientId) throw new BadRequestException('Choose a patient');

    if (dto.staffId) {
      const from = new Date(dto.dateTime.getTime() - (SLOT_MINUTES - 1) * 60_000);
      const to = new Date(dto.dateTime.getTime() + (SLOT_MINUTES - 1) * 60_000);
      const clash = await this.prisma.appointment.findFirst({
        where: { staffId: dto.staffId, status: { notIn: ['CANCELLED', 'NO_SHOW'] }, dateTime: { gte: from, lte: to } },
      });
      if (clash) throw new ConflictException('That staff member already has an appointment in this 30-minute slot');
    }

    const appointment = await this.prisma.appointment.create({
      data: { patientId, staffId: dto.staffId, serviceId: dto.serviceId, dateTime: dto.dateTime, notes: dto.notes },
      include: { ...include, patient: true },
    });
    await this.events.emit(EVENTS.APPOINTMENT_BOOKED, { appointment });
    return appointment;
  }

  // Called when an order is completed: close the appointment it came from.
  async completeForOrder({ orderId }) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, select: { appointmentId: true } });
    if (!order?.appointmentId) return;
    await this.prisma.appointment.updateMany({
      where: { id: order.appointmentId, status: { in: ['SCHEDULED', 'CHECKED_IN'] } },
      data: { status: 'COMPLETED' },
    });
  }

  async updateStatus(user, id, status) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (user.role === 'PATIENT') {
      if (appointment.patientId !== user.patientId) throw new ForbiddenException();
      if (status !== 'CANCELLED') throw new ForbiddenException('Patients can only cancel appointments');
    }
    if (user.role === 'DOCTOR' && appointment.staffId !== user.staffId) {
      throw new ForbiddenException('This appointment is booked with another doctor');
    }
    if (['COMPLETED', 'CANCELLED'].includes(appointment.status)) {
      throw new BadRequestException(`This appointment is already ${appointment.status.toLowerCase()}`);
    }
    return this.prisma.appointment.update({ where: { id }, data: { status }, include });
  }
}
