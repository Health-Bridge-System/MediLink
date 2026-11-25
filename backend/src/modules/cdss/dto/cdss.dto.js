import { z } from 'zod';
import { paginationQuery } from '../../../common/pipes/zod-validation.pipe.js';

export const queryAlertsDto = paginationQuery.extend({
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  patientId: z.coerce.number().int().positive().optional(),
});

export const queryResultsDto = paginationQuery.extend({
  reviewStatus: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']).optional(),
});

export const reviewResultDto = z.object({
  reviewStatus: z.enum(['ACCEPTED', 'REJECTED']),
});
