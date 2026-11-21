import { z } from 'zod';
import { paginationQuery } from '../../../common/pipes/zod-validation.pipe.js';

export const queryInvoicesDto = paginationQuery.extend({
  paymentStatus: z.enum(['UNPAID', 'PARTIAL', 'PAID']).optional(),
  patientId: z.coerce.number().int().positive().optional(),
});

export const createPaymentDto = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero').multipleOf(0.01, 'Use at most 2 decimals'),
  method: z.enum(['CASH', 'CARD', 'INSURANCE']),
});
