import { z } from 'zod';

export const createPrescriptionDto = z.object({
  patientId: z.coerce.number().int().positive(),
  issueDate: z.coerce.date().default(() => new Date()),
  notes: z.string().trim().max(2000).optional(),
  items: z
    .array(
      z.object({
        drugName: z.string().trim().min(2).max(100),
        dose: z.string().trim().max(50).optional(),
        frequency: z.string().trim().max(50).optional(),
        durationDays: z.coerce.number().int().min(1).max(365).optional(),
      }),
    )
    .min(1, 'Add at least one medication')
    .max(15),
});
