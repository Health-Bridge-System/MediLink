import { z } from 'zod';
import { paginationQuery } from '../../../common/pipes/zod-validation.pipe.js';

const emptyToUndefined = (v) => (v === '' || v === null ? undefined : v);

export const createPatientDto = z.object({
  fullName: z.string().trim().min(3, 'Enter the full name').max(120),
  // Egyptian national ID: 14 digits
  nationalId: z.string().trim().regex(/^\d{14}$/, 'National ID must be 14 digits'),
  birthDate: z.coerce
    .date({ error: 'Enter a valid birth date' })
    .refine((d) => d <= new Date(), 'Birth date cannot be in the future')
    .refine((d) => d.getFullYear() >= 1900, 'Birth date looks wrong'),
  gender: z.enum(['MALE', 'FEMALE']),
  phone: z.preprocess(emptyToUndefined, z.string().trim().regex(/^\+?\d{8,15}$/, 'Phone must be 8–15 digits').optional()),
  email: z.preprocess(emptyToUndefined, z.email('Enter a valid email').max(120).optional()),
  address: z.preprocess(emptyToUndefined, z.string().trim().max(255).optional()),
});

export const updatePatientDto = createPatientDto.partial().omit({ nationalId: true });

export const queryPatientsDto = paginationQuery.extend({
  search: z.string().trim().max(60).optional(),
});
