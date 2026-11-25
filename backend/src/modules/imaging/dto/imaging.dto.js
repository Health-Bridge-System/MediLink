import { z } from 'zod';

const modality = z.enum(['CR', 'DX', 'CT', 'MR', 'US']);

export const createStudyDto = z.object({
  itemId: z.coerce.number().int().positive(),
  performedAt: z.coerce.date().optional(),
  series: z
    .array(
      z.object({
        modality: modality.optional(),
        bodyPart: z.string().trim().max(50).optional(),
        description: z.string().trim().max(255).optional(),
        numInstances: z.coerce.number().int().min(1).max(5000).default(1),
      }),
    )
    .min(1, 'A study needs at least one series')
    .max(20),
});

export const upsertReportDto = z
  .object({
    findings: z.string().trim().max(5000).optional(),
    impression: z.string().trim().max(2000).optional(),
    status: z.enum(['DRAFT', 'FINAL']).default('DRAFT'),
  })
  .refine((r) => r.status === 'DRAFT' || (r.findings && r.impression), {
    message: 'Findings and impression are required to sign a final report',
    path: ['impression'],
  });

const point = z.object({ x: z.number(), y: z.number() });

export const createAnnotationDto = z.object({
  instanceUid: z.string().max(128).optional(),
  type: z.enum(['LENGTH', 'ANGLE', 'ROI', 'ARROW', 'TEXT']),
  geometry: z.object({
    points: z.array(point).min(1).max(50),
    value: z.number().optional(),
    unit: z.enum(['mm', 'deg', 'mm2', 'HU']).optional(),
  }),
  note: z.string().trim().max(1000).optional(),
});
