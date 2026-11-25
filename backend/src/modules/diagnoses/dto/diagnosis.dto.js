import { z } from 'zod';
import { icd10Code } from '../../orders/dto/order.dto.js';

export const createDiagnosisDto = z.object({
  patientId: z.coerce.number().int().positive(),
  orderId: z.coerce.number().int().positive().optional(),
  icd10Code,
  description: z.string().trim().max(255).optional(),
  diagnosedAt: z.coerce.date().default(() => new Date()),
});
