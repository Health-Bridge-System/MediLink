import { z } from 'zod';

const value = z.union([z.number(), z.string().trim().min(1).max(40)]).transform(String);

export const createLabResultsDto = z.object({
  values: z
    .array(
      z.object({
        testName: z.string().trim().min(1).max(80),
        value,
        // Optional for analytes not in our reference table
        unit: z.string().trim().max(20).optional(),
        normalRange: z.string().trim().max(40).optional(),
      }),
    )
    .min(1, 'Enter at least one value')
    .max(30),
});
