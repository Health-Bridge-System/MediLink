import { z } from 'zod';

export const queryStaffDto = z.object({
  role: z.enum(['DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'RECEPTIONIST', 'ADMIN']).optional(),
});
