import { BadRequestException, NotFoundException } from '../../common/exceptions/http.exception.js';
import { assertPatientAccess } from '../../common/guards/roles.guard.js';
import { EVENTS } from '../../core/events.js';
import { dicomUid } from './dicom-uid.js';

const staffName = { select: { id: true, fullName: true } };

const studyInclude = {
  series: { include: { annotations: { include: { staff: staffName }, orderBy: { createdAt: 'asc' } } } },
  report: { include: { radiologist: staffName } },
  cdssResults: { include: { reviewer: staffName }, orderBy: { createdAt: 'desc' } },
  item: {
    include: {
      service: true,
      order: { include: { patient: { select: { id: true, fullName: true, gender: true, birthDate: true } }, doctor: staffName } },
    },
  },
};

export class ImagingService {
  constructor({ prisma, events }) {
    this.prisma = prisma;
    this.events = events;
  }

  findAll() {
    return this.prisma.imagingStudy.findMany({ orderBy: { createdAt: 'desc' }, take: 100, include: studyInclude });
  }

  async findOne(user, id) {
    const study = await this.prisma.imagingStudy.findUnique({ where: { id }, include: studyInclude });
    if (!study) throw new NotFoundException('Imaging study not found');
    assertPatientAccess(user, study.item.order.patientId);
    if (user.role === 'PATIENT') {
      if (study.report?.status !== 'FINAL') study.report = null;
      study.cdssResults = [];
    }
    return study;
  }

  async create(user, { itemId, performedAt, series }) {
    const item = await this.prisma.orderItem.findUnique({ where: { id: itemId }, include: { service: true, imagingStudy: true } });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.service.type !== 'RADIOLOGY') throw new BadRequestException('This is not an imaging test');
    if (item.imagingStudy) throw new BadRequestException(`Study #${item.imagingStudy.id} already exists for this test`);
    if (item.status === 'CANCELLED') throw new BadRequestException('This test was cancelled');

    const studyUid = dicomUid();
    const modality = item.service.modality ?? 'CR';

    const study = await this.prisma.$transaction(async (tx) => {
      const created = await tx.imagingStudy.create({
        data: {
          itemId,
          dicomStudyUid: studyUid,
          imagePath: `orthanc://studies/${studyUid}`,
          performedAt: performedAt ?? new Date(),
          series: {
            create: series.map((s) => {
              const seriesUid = dicomUid();
              return {
                seriesUid,
                modality: s.modality ?? modality,
                bodyPart: s.bodyPart,
                description: s.description,
                numInstances: s.numInstances,
                storagePath: `orthanc://series/${seriesUid}`,
              };
            }),
          },
        },
      });
      await tx.orderItem.update({ where: { id: itemId }, data: { status: 'IN_PROGRESS', performedBy: item.performedBy ?? user.staffId } });
      return created;
    });

    await this.events.emit(EVENTS.ORDER_ITEM_CHANGED, { orderId: item.orderId });
    // CDSS runs the imaging model on the stored study.
    await this.events.emit(EVENTS.IMAGING_STUDY_STORED, { study, modality });
    return this.findOne(user, study.id);
  }

  async reanalyze(user, id) {
    const study = await this.findOne(user, id);
    await this.events.emit(EVENTS.IMAGING_STUDY_STORED, { study, modality: study.item.service.modality ?? 'CR' });
    return this.findOne(user, id);
  }

  async upsertReport(user, studyId, { findings, impression, status }) {
    const study = await this.findOne(user, studyId);
    if (study.report?.status === 'FINAL') throw new BadRequestException('This report is already signed and can no longer be edited');

    const signing = status === 'FINAL';
    const data = { findings, impression, status, radiologistId: user.staffId, signedAt: signing ? new Date() : null };

    const { report, item } = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.radiologyReport.upsert({ where: { studyId }, create: { studyId, ...data }, update: data });
      const updatedItem = signing
        ? await tx.orderItem.update({ where: { id: study.itemId }, data: { status: 'COMPLETED', completedAt: new Date() }, include: { service: true } })
        : null;
      return { report: saved, item: updatedItem };
    });

    if (signing) {
      const order = await this.prisma.order.findUnique({ where: { id: item.orderId }, include: { patient: true } });
      await this.events.emit(EVENTS.REPORT_SIGNED, { order, item, report });
      await this.events.emit(EVENTS.ORDER_ITEM_CHANGED, { orderId: item.orderId });
    }
    return this.findOne(user, studyId);
  }

  async addAnnotation(user, seriesId, dto) {
    const series = await this.prisma.imagingSeries.findUnique({ where: { id: seriesId } });
    if (!series) throw new NotFoundException('Series not found');
    return this.prisma.annotation.create({ data: { ...dto, seriesId, staffId: user.staffId }, include: { staff: staffName } });
  }
}
