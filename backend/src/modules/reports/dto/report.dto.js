import { z } from 'zod';

export const dashboardQueryDto = z.object({
  days: z.coerce.number().int().min(7).max(90).default(14),
});
