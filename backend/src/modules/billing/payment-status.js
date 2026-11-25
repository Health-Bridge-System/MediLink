import { Prisma } from '@prisma/client';

// UNPAID / PARTIAL / PAID from the invoice total and what has been paid.
export function paymentStatusFor(total, paid) {
  const t = new Prisma.Decimal(total);
  const p = new Prisma.Decimal(paid);
  if (p.lte(0)) return 'UNPAID';
  if (p.gte(t)) return 'PAID';
  return 'PARTIAL';
}
