import { Prisma } from '@prisma/client';
import { BadRequestException, NotFoundException } from '../../common/exceptions/http.exception.js';
import { paymentStatusFor } from './payment-status.js';

const invoiceInclude = {
  patient: { select: { id: true, fullName: true } },
  items: { include: { orderItem: { include: { service: true } } } },
  payments: { orderBy: { paidAt: 'asc' } },
  order: { select: { id: true, orderDate: true, priority: true } },
};

export class BillingService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  // One invoice per order; prices are copied from the service at billing time
  // so later price-list changes never alter old bills. ICD-10 comes from the
  // order's diagnosis when there is one.
  async createForOrder({ orderId }) {
    const existing = await this.prisma.invoice.findUnique({ where: { orderId } });
    if (existing) return existing;

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { where: { status: { not: 'CANCELLED' } }, include: { service: true } }, diagnoses: true },
    });
    if (!order || order.items.length === 0) return null;

    const icd10Code = order.diagnoses[0]?.icd10Code ?? null;
    const total = order.items.reduce((sum, i) => sum.add(i.service.price), new Prisma.Decimal(0));

    return this.prisma.invoice.create({
      data: {
        patientId: order.patientId,
        orderId,
        total,
        items: { create: order.items.map((i) => ({ orderItemId: i.id, price: i.service.price, icd10Code })) },
      },
    });
  }

  async findAll({ page, pageSize, paymentStatus, patientId }) {
    const where = { ...(paymentStatus && { paymentStatus }), ...(patientId && { patientId }) };
    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, include: invoiceInclude }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findOne(id) {
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async pay(id, { amount, method }) {
    const invoice = await this.findOne(id);
    const paid = invoice.payments.reduce((s, p) => s.add(p.amount), new Prisma.Decimal(0));
    const balance = new Prisma.Decimal(invoice.total).sub(paid);
    if (balance.lte(0)) throw new BadRequestException('This invoice is already fully paid');
    if (new Prisma.Decimal(amount).gt(balance)) {
      throw new BadRequestException(`Amount exceeds the remaining balance of ${balance.toFixed(2)} EGP`);
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.create({ data: { invoiceId: id, amount, method } });
      await tx.invoice.update({ where: { id }, data: { paymentStatus: paymentStatusFor(invoice.total, paid.add(amount)) } });
      return tx.invoice.findUnique({ where: { id }, include: invoiceInclude });
    });
  }
}
