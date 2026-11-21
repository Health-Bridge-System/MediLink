import { z } from 'zod';
import { paginationQuery } from '../../../common/pipes/zod-validation.pipe.js';

export const createAppointmentDto = z.object({
  // Required for staff; ignored for patients (they always book for themselves).
  patientId: z.coerce.number().int().positive().optional(),
  staffId: z.coerce.number().int().positive().optional(),
  serviceId: z.coerce.number().int().positive(),
  dateTime: z.coerce
    .date({ error: 'Pick a date and time' })
    .refine((d) => d.getTime() > Date.now() - 5 * 60_000, 'Pick a time in the future')
    .refine((d) => d.getHours() >= 8 && d.getHours() < 20, 'The center is open 08:00–20:00'),
  notes: z.string().trim().max(255).optional(),
});

export const updateAppointmentStatusDto = z.object({
  status: z.enum(['SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

export const queryAppointmentsDto = paginationQuery.extend({
  status: z.enum(['SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
  patientId: z.coerce.number().int().positive().optional(),
  upcoming: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
});
