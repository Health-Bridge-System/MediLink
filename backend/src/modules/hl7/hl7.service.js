import { NotFoundException } from '../../common/exceptions/http.exception.js';
import * as builder from './hl7.builder.js';

// Logs every outbound HL7 message and the EMR's ACK reply.
// `transmit` is the only part that talks to the outside world: today it
// acknowledges locally; an MLLP client to the EMR simulator replaces it.
export class Hl7Service {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  async transmit(rawMessage, controlId) {
    return { ackCode: 'AA', ack: builder.buildAck({ originalControlId: controlId, controlId: builder.newControlId(), at: new Date() }) };
  }

  async send({ messageType, rawMessage, controlId, orderId = null, patientId = null }) {
    const message = await this.prisma.hl7Message.create({
      data: { messageType, direction: 'OUTBOUND', status: 'QUEUED', controlId, rawMessage, orderId, patientId },
    });

    try {
      const { ackCode, ack } = await this.transmit(rawMessage, controlId);
      const now = new Date();
      await this.prisma.hl7Message.update({ where: { id: message.id }, data: { status: 'ACKED', ackCode, sentAt: now } });
      await this.prisma.hl7Message.create({
        data: {
          messageType: 'ACK',
          direction: 'INBOUND',
          status: 'ACKED',
          controlId: ack.split('\r')[0].split('|')[9],
          rawMessage: ack,
          ackCode,
          orderId,
          patientId,
          sentAt: now,
        },
      });
    } catch (err) {
      await this.prisma.hl7Message.update({ where: { id: message.id }, data: { status: 'FAILED', error: err.message.slice(0, 255) } });
    }
    return message;
  }

  patientRegistered({ patient }) {
    const controlId = builder.newControlId();
    const rawMessage = builder.buildAdtA04({ patient, controlId, at: new Date() });
    return this.send({ messageType: 'ADT^A04', rawMessage, controlId, patientId: patient.id });
  }

  appointmentBooked({ appointment }) {
    const controlId = builder.newControlId();
    const rawMessage = builder.buildSiuS12({ appointment, patient: appointment.patient, service: appointment.service, controlId, at: new Date() });
    return this.send({ messageType: 'SIU^S12', rawMessage, controlId, patientId: appointment.patientId });
  }

  orderPlaced({ order }) {
    const controlId = builder.newControlId();
    const rawMessage = builder.buildOrmO01({ order, patient: order.patient, items: order.items, doctor: order.doctor, controlId, at: new Date() });
    return this.send({ messageType: 'ORM^O01', rawMessage, controlId, orderId: order.id, patientId: order.patientId });
  }

  resultsReady({ order, item, results, report }) {
    const controlId = builder.newControlId();
    const rawMessage = builder.buildOruR01({ order, patient: order.patient, item, results, report, controlId, at: new Date() });
    return this.send({ messageType: 'ORU^R01', rawMessage, controlId, orderId: order.id, patientId: order.patientId });
  }

  async findAll({ page, pageSize, messageType, direction }) {
    const where = { ...(messageType && { messageType }), ...(direction && { direction }) };
    const [items, total] = await Promise.all([
      this.prisma.hl7Message.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { patient: { select: { id: true, fullName: true } } },
      }),
      this.prisma.hl7Message.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id) {
    const message = await this.prisma.hl7Message.findUnique({ where: { id }, include: { patient: { select: { id: true, fullName: true } } } });
    if (!message) throw new NotFoundException('HL7 message not found');
    return message;
  }
}
