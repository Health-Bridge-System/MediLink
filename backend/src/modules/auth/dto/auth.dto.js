import { z } from 'zod';
import { createPatientDto } from '../../patients/dto/patient.dto.js';

export const loginDto = z.object({
  username: z.string().trim().min(3).max(50),
  password: z.string().min(1, 'Password is required').max(128),
});

export const demoLoginDto = z.object({
  username: z.string().trim().min(3).max(50),
});

export const registerDto = createPatientDto.extend({
  username: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[a-z0-9._-]+$/i, 'Use letters, numbers, dots, dashes or underscores'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .max(128)
    .regex(/[A-Za-z]/, 'Include at least one letter')
    .regex(/\d/, 'Include at least one number'),
});
