import { NotFoundException } from '../../common/exceptions/http.exception.js';
import { assertPatientAccess } from '../../common/guards/roles.guard.js';
import { EVENTS } from '../../core/events.js';

const staffName = { select: { id: true, fullName: true, role: true } };

export class PatientsService {
  constructor({ prisma, events }) {
    this.prisma = prisma;
    this.events = events;
  }

  async findAll({ page, pageSize, search }) {
    const where = search
      ? { OR: [{ fullName: { contains: search } }, { nationalId: { contains: search } }, { phone: { contains: search } }] }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.patient.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { orders: true, appointments: true } } },
      }),
      this.prisma.patient.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(user, id) {
    assertPatientAccess(user, id);
    const patient = await this.prisma.patient.findUnique({ where: { id } });
    if (!patient) throw new NotFoundException('Patient not found');
    return patient;
  }

  // The medical-history page: everything about one patient, newest first.
  // Patients only see FINAL radiology reports; drafts stay internal.
  async history(user, id) {
    const patient = await this.findOne(user, id);
    const isPatient = user.role === 'PATIENT';

    const [appointments, orders, diagnoses, prescriptions, invoices] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId: id },
        orderBy: { dateTime: 'desc' },
        include: { service: true, staff: staffName },
      }),
      this.prisma.order.findMany({
        where: { patientId: id },
        orderBy: { orderDate: 'desc' },
        include: {
          doctor: staffName,
          items: {
            include: {
              service: true,
              labResults: true,
              cdssAlerts: !isPatient,
              imagingStudy: {
                include: {
                  series: true,
                  report: { include: { radiologist: staffName } },
                  cdssResults: !isPatient,
                },
              },
            },
          },
        },
      }),
      this.prisma.diagnosis.findMany({ where: { patientId: id }, orderBy: { diagnosedAt: 'desc' }, include: { doctor: staffName } }),
      this.prisma.prescription.findMany({
        where: { patientId: id },
        orderBy: { issueDate: 'desc' },
        include: { doctor: staffName, items: true },
      }),
      // Billing is visible to administrators only.
      user.role === 'ADMIN'
        ? this.prisma.invoice.findMany({ where: { patientId: id }, orderBy: { createdAt: 'desc' }, include: { payments: true } })
        : [],
    ]);

    if (isPatient) {
      for (const order of orders) {
        for (const item of order.items) {
          const study = item.imagingStudy;
          if (study?.report && study.report.status !== 'FINAL') study.report = null;
        }
      }
    }

    return { patient, appointments, orders, diagnoses, prescriptions, invoices };
  }

  async create(data) {
    const patient = await this.prisma.patient.create({ data });
    await this.events.emit(EVENTS.PATIENT_REGISTERED, { patient });
    return patient;
  }

  async update(user, id, data) {
    await this.findOne(user, id);
    return this.prisma.patient.update({ where: { id }, data });
  }
}
