import { z } from 'zod';
import { paginationQuery } from '../../../common/pipes/zod-validation.pipe.js';

export const icd10Code = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-TV-Z]\d{2}(\.[0-9A-Z]{1,4})?$/, 'Use an ICD-10 code like J18.9');

export const createOrderDto = z.object({
  patientId: z.coerce.number().int().positive(),
  appointmentId: z.coerce.number().int().positive().optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
  serviceIds: z
    .array(z.coerce.number().int().positive())
    .min(1, 'Add at least one test')
    .max(12)
    .refine((ids) => new Set(ids).size === ids.length, 'The same test was added twice'),
  diagnosis: z
    .object({
      icd10Code,
      description: z.string().trim().max(255).optional(),
    })
    .optional(),
});

export const queryOrdersDto = paginationQuery.extend({
  status: z.enum(['ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  patientId: z.coerce.number().int().positive().optional(),
});

export const queryWorklistDto = z.object({
  type: z.enum(['LAB', 'RADIOLOGY']),
  status: z.enum(['ORDERED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'OPEN']).default('OPEN'),
});
