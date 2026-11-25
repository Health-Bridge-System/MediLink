import { LAB_PANELS, rangeText } from '../../common/reference/lab-panels.js';

export class ServicesService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  async findAll({ type }) {
    const services = await this.prisma.service.findMany({ where: type ? { type } : {}, orderBy: [{ type: 'asc' }, { name: 'asc' }] });
    // Attach the analytes so the result-entry form knows which fields to show.
    return services.map((s) => ({
      ...s,
      analytes: (LAB_PANELS[s.name] ?? []).map((a) => ({ testName: a.testName, unit: a.unit, normalRange: rangeText(a) })),
    }));
  }

  create(data) {
    return this.prisma.service.create({ data });
  }

  update(id, data) {
    return this.prisma.service.update({ where: { id }, data });
  }
}
