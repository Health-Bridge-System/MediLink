import { BadRequestException, NotFoundException } from '../../common/exceptions/http.exception.js';
import { computeFlag, findAnalyte, rangeText } from '../../common/reference/lab-panels.js';
import { EVENTS } from '../../core/events.js';

export class ResultsService {
  constructor({ prisma, events }) {
    this.prisma = prisma;
    this.events = events;
  }

  async recordLabResults(user, itemId, { values }) {
    const item = await this.prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { service: true, order: { include: { patient: true } } },
    });
    if (!item) throw new NotFoundException('Order item not found');
    if (item.service.type !== 'LAB') throw new BadRequestException('This is not a laboratory test');
    if (['COMPLETED', 'CANCELLED'].includes(item.status)) {
      throw new BadRequestException(`Results can't be added to a ${item.status.toLowerCase()} test`);
    }

    // Unit, range and flag come from the reference table, so the lab tech
    // only types values and the flag can't be set by hand.
    const results = values.map((v) => {
      const analyte = findAnalyte(item.service.name, v.testName);
      return {
        itemId,
        testName: analyte?.testName ?? v.testName,
        value: v.value,
        unit: analyte?.unit ?? v.unit ?? null,
        normalRange: analyte ? rangeText(analyte) : (v.normalRange ?? null),
        flag: computeFlag(analyte, v.value),
      };
    });

    const completed = await this.prisma.$transaction(async (tx) => {
      await tx.labResult.createMany({ data: results });
      return tx.orderItem.update({
        where: { id: itemId },
        data: { status: 'COMPLETED', performedBy: user.staffId, completedAt: new Date() },
        include: { service: true },
      });
    });

    // CDSS returns { alerts }, HL7 sends ORU^R01, orders returns { orderStatus }.
    const { alerts = [] } = await this.events.emit(EVENTS.LAB_RESULTS_RECORDED, { order: item.order, item: completed, results });
    const { orderStatus } = await this.events.emit(EVENTS.ORDER_ITEM_CHANGED, { orderId: item.orderId });
    return { results, alerts, orderStatus };
  }
}
