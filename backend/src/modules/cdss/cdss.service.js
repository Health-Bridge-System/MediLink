import { NotFoundException } from '../../common/exceptions/http.exception.js';
import { analyzeStudy } from './cdss.client.js';
import { duplicateOrderRule, labResultRules } from './cdss.rules.js';

const patientSelect = { select: { id: true, fullName: true } };

export class CdssService {
  constructor({ prisma, cdssUrl }) {
    this.prisma = prisma;
    this.cdssUrl = cdssUrl;
  }

  async alertsForLabResults({ item, results }) {
    const drafts = labResultRules(item.service.name, results);
    if (drafts.length) {
      await this.prisma.cdssAlert.createMany({ data: drafts.map((d) => ({ ...d, itemId: item.id })) });
    }
    return drafts;
  }

  // Same test ordered for the same patient within 24 hours.
  async checkDuplicates({ order }) {
    for (const item of order.items) {
      const previous = await this.prisma.orderItem.findFirst({
        where: {
          serviceId: item.serviceId,
          status: { not: 'CANCELLED' },
          orderId: { not: order.id },
          order: { patientId: order.patientId },
          createdAt: { gte: new Date(Date.now() - 24 * 36e5) },
        },
        orderBy: { createdAt: 'desc' },
      });
      const draft = duplicateOrderRule(item.service.name, previous);
      if (draft) await this.prisma.cdssAlert.create({ data: { ...draft, itemId: item.id } });
    }
  }

  // Runs the imaging model and stores its suggestion for clinician review.
  async analyzeImaging({ study, modality }) {
    const out = await analyzeStudy({ studyId: study.id, studyUid: study.dicomStudyUid, modality }, this.cdssUrl);
    return this.prisma.cdssResult.create({
      data: {
        studyId: study.id,
        modelName: out.model,
        prediction: out.prediction,
        confidence: out.confidence,
        heatmapPath: out.heatmapPath,
        details: { scores: out.scores, stub: out.stub },
      },
    });
  }

  async findAlerts({ severity, patientId, page, pageSize }) {
    const where = { ...(severity && { severity }), ...(patientId && { item: { order: { patientId } } }) };
    const [items, total] = await Promise.all([
      this.prisma.cdssAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { item: { include: { service: true, order: { include: { patient: patientSelect } } } } },
      }),
      this.prisma.cdssAlert.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async findResults({ reviewStatus, page, pageSize }) {
    const where = reviewStatus ? { reviewStatus } : {};
    const [items, total] = await Promise.all([
      this.prisma.cdssResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          reviewer: { select: { id: true, fullName: true } },
          study: { include: { item: { include: { service: true, order: { include: { patient: patientSelect } } } } } },
        },
      }),
      this.prisma.cdssResult.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async review(id, staffId, reviewStatus) {
    const existing = await this.prisma.cdssResult.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('CDSS result not found');
    return this.prisma.cdssResult.update({ where: { id }, data: { reviewStatus, reviewedBy: staffId } });
  }
}
