import { Prisma } from '@prisma/client';

// Reports have no tables of their own: they are queries over the ERD tables.
const num = (v) => (v === null || v === undefined ? 0 : Number(v));
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

export class ReportsService {
  constructor({ prisma }) {
    this.prisma = prisma;
  }

  async dashboard({ days }, { includeFinance = false } = {}) {
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      patients,
      ordersToday,
      openItems,
      criticalAlerts,
      pendingAi,
      revenueMonth,
      outstanding,
      turnaround,
      perDay,
      revenueByMonth,
      workload,
      topServices,
      topDiagnoses,
      flags,
    ] = await Promise.all([
      this.prisma.patient.count(),
      this.prisma.order.count({ where: { orderDate: { gte: startOfToday } } }),
      this.prisma.orderItem.count({ where: { status: { in: ['ORDERED', 'IN_PROGRESS'] } } }),
      this.prisma.cdssAlert.count({ where: { severity: 'CRITICAL', createdAt: { gte: since } } }),
      this.prisma.cdssResult.count({ where: { reviewStatus: 'PENDING' } }),
      this.prisma.payment.aggregate({ _sum: { amount: true }, where: { paidAt: { gte: startOfMonth } } }),
      this.prisma.$queryRaw`
        SELECT COALESCE(SUM(i.total - COALESCE(p.paid, 0)), 0) AS balance
        FROM invoice i
        LEFT JOIN (SELECT invoice_id, SUM(amount) AS paid FROM payment GROUP BY invoice_id) p ON p.invoice_id = i.invoice_id
        WHERE i.payment_status <> 'PAID'`,
      this.prisma.$queryRaw`
        SELECT s.type AS type, AVG(TIMESTAMPDIFF(MINUTE, oi.created_at, oi.completed_at)) AS minutes
        FROM order_item oi JOIN service s ON s.service_id = oi.service_id
        WHERE oi.completed_at IS NOT NULL AND oi.completed_at >= ${since}
        GROUP BY s.type`,
      this.prisma.$queryRaw`
        SELECT DATE(oi.created_at) AS day, s.type AS type, COUNT(*) AS n
        FROM order_item oi JOIN service s ON s.service_id = oi.service_id
        WHERE oi.created_at >= ${since}
        GROUP BY day, s.type ORDER BY day`,
      this.prisma.$queryRaw`
        SELECT DATE_FORMAT(paid_at, '%Y-%m') AS month, SUM(amount) AS total
        FROM payment WHERE paid_at >= ${sixMonthsAgo}
        GROUP BY month ORDER BY month`,
      this.prisma.$queryRaw`
        SELECT st.full_name AS name, st.role AS role, COUNT(*) AS n
        FROM order_item oi JOIN staff st ON st.staff_id = oi.performed_by
        WHERE oi.status = 'COMPLETED' AND oi.completed_at >= ${since}
        GROUP BY st.staff_id, st.full_name, st.role ORDER BY n DESC LIMIT 8`,
      this.prisma.$queryRaw`
        SELECT s.name AS name, s.type AS type, COUNT(*) AS n
        FROM order_item oi JOIN service s ON s.service_id = oi.service_id
        WHERE oi.created_at >= ${since}
        GROUP BY s.service_id, s.name, s.type ORDER BY n DESC LIMIT 6`,
      this.prisma.$queryRaw`
        SELECT icd10_code AS code, MAX(description) AS description, COUNT(*) AS n
        FROM diagnosis GROUP BY icd10_code ORDER BY n DESC LIMIT 6`,
      this.prisma.labResult.groupBy({ by: ['flag'], _count: { _all: true } }),
    ]);

    // Fill days with no orders so the chart has a continuous axis.
    const series = new Map();
    for (let d = new Date(since); d <= now; d.setDate(d.getDate() + 1)) series.set(dayKey(d), { day: dayKey(d), LAB: 0, RADIOLOGY: 0 });
    for (const row of perDay) {
      const entry = series.get(dayKey(row.day));
      if (entry) entry[row.type] = num(row.n);
    }

    const tat = Object.fromEntries(turnaround.map((r) => [r.type, Math.round(num(r.minutes))]));

    const result = {
      kpis: {
        patients,
        ordersToday,
        openItems,
        criticalAlerts,
        pendingAi,
        revenueMonth: num(revenueMonth._sum.amount ?? new Prisma.Decimal(0)),
        outstanding: num(outstanding[0]?.balance),
        turnaroundLabMin: tat.LAB ?? null,
        turnaroundRadMin: tat.RADIOLOGY ?? null,
      },
      testsPerDay: [...series.values()],
      revenueByMonth: revenueByMonth.map((r) => ({ month: r.month, total: num(r.total) })),
      workload: workload.map((r) => ({ name: r.name, role: r.role, count: num(r.n) })),
      topServices: topServices.map((r) => ({ name: r.name, type: r.type, count: num(r.n) })),
      topDiagnoses: topDiagnoses.map((r) => ({ code: r.code, description: r.description, count: num(r.n) })),
      resultFlags: Object.fromEntries(flags.map((f) => [f.flag, f._count._all])),
    };

    // Revenue and balances are billing data, so only administrators get them.
    if (!includeFinance) {
      result.kpis.revenueMonth = null;
      result.kpis.outstanding = null;
      result.revenueByMonth = null;
    }
    return result;
  }
}
