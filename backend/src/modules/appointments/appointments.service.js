import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '../../common/exceptions/http.exception.js';
import { EVENTS } from '../../core/events.js';
import { canTransitionAppointment, mayRescheduleAppointment } from './appointments.rules.js';

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
      const doctor = await this.prisma.staff.findUnique({ where: { id: dto.staffId } });
      if (!doctor || doctor.role !== 'DOCTOR') throw new BadRequestException('Select a valid doctor');
      const from = new Date(dto.dateTime.getTime() - (SLOT_MINUTES - 1) * 60_000);
      const to = new Date(dto.dateTime.getTime() + (SLOT_MINUTES - 1) * 60_000);
      const clash = await this.prisma.appointment.findFirst({
        where: { staffId: dto.staffId, status: { notIn: ['CANCELLED', 'NO_SHOW'] }, dateTime: { gte: from, lte: to } },
      });
      if (clash) throw new ConflictException('That staff member already has an appointment in this 30-minute slot');
    }

    const [patient, service] = await Promise.all([
      this.prisma.patient.findUnique({ where: { id: patientId }, select: { id: true } }),
      this.prisma.service.findUnique({ where: { id: dto.serviceId }, select: { id: true } }),
    ]);
    if (!patient) throw new BadRequestException('Patient not found');
    if (!service) throw new BadRequestException('Service not found');

    const appointment = await this.prisma.appointment.create({
      data: { patientId, staffId: dto.staffId, serviceId: dto.serviceId, dateTime: dto.dateTime, notes: dto.notes },
      include: { ...include, patient: true },
    });
    await this.events.emit(EVENTS.APPOINTMENT_BOOKED, { appointment });
    return appointment;
  }

  async reschedule(user, id, dateTime) {
    // A cancelled or already-started appointment cannot be moved to another slot.
    return this.prisma.$transaction(async (tx) => {
      const appointment = await tx.appointment.findUnique({ where: { id }, include: { order: true } });
      if (!appointment) throw new NotFoundException('Appointment not found');
      if (user.role === 'PATIENT' && appointment.patientId !== user.patientId) throw new ForbiddenException();
      if (!mayRescheduleAppointment(appointment.status) || appointment.order) {
        throw new BadRequestException('Only scheduled appointments without orders can be rescheduled');
      }
      if (appointment.staffId) {
        const from = new Date(dateTime.getTime() - (SLOT_MINUTES - 1) * 60000);
        const to = new Date(dateTime.getTime() + (SLOT_MINUTES - 1) * 60000);
        const clash = await tx.appointment.findFirst({ where: { id: { not: id }, staffId: appointment.staffId,
          status: { notIn: ['CANCELLED','NO_SHOW'] }, dateTime: { gte: from, lte: to } } });
        if (clash) throw new ConflictException('That doctor already has an appointment in this slot');
      }
      return tx.appointment.update({ where: { id }, data: { dateTime }, include });
    });
  }

  async updateStatus(user, id, status) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id }, include: { order: true } });
    if (!appointment) throw new NotFoundException('Appointment not found');
    if (user.role === 'PATIENT') {
      if (appointment.patientId !== user.patientId) throw new ForbiddenException();
      if (status !== 'CANCELLED') throw new ForbiddenException('Patients can only cancel appointments');
    }
    if (!canTransitionAppointment(appointment.status, status)) {
      throw new BadRequestException(`Cannot change appointment from ${appointment.status} to ${status}`);
    }
    if (appointment.order && status === 'CANCELLED') {
      throw new BadRequestException('This appointment has a linked order; resolve the order before cancelling');
    }
    return this.prisma.appointment.update({ where: { id }, data: { status }, include });
  }
}
