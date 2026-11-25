import { z } from 'zod';

export const createServiceDto = z
  .object({
    name: z.string().trim().min(2).max(100),
    type: z.enum(['LAB', 'RADIOLOGY']),
    modality: z.enum(['CR', 'DX', 'CT', 'MR', 'US']).optional(),
    price: z.coerce.number().positive().max(1_000_000).multipleOf(0.01),
  })
  .refine((s) => s.type === 'LAB' || s.modality, { message: 'Radiology services need a modality', path: ['modality'] });

export const updateServiceDto = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  price: z.coerce.number().positive().max(1_000_000).multipleOf(0.01).optional(),
});

export const queryServicesDto = z.object({
  type: z.enum(['LAB', 'RADIOLOGY']).optional(),
});
