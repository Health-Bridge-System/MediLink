import { z } from 'zod';

// Client-side Zod schemas give instant feedback; the Express API validates
// the same rules again, so the server stays the source of truth.

const optionalText = (schema) => z.preprocess((v) => (v === '' ? undefined : v), schema.optional());

export const loginSchema = z.object({
  username: z.string().trim().min(3, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});

export const patientSchema = z.object({
  fullName: z.string().trim().min(3, 'Enter the full name'),
  nationalId: z.string().trim().regex(/^\d{14}$/, 'National ID must be 14 digits'),
  birthDate: z.string().min(1, 'Enter the birth date'),
  gender: z.enum(['MALE', 'FEMALE'], { error: 'Choose a gender' }),
  phone: optionalText(z.string().trim().regex(/^\+?\d{8,15}$/, 'Phone must be 8–15 digits')),
  email: optionalText(z.email('Enter a valid email')),
  address: optionalText(z.string().trim().max(255)),
});

export const registerSchema = patientSchema.extend({
  username: z
    .string()
    .trim()
    .min(3, 'At least 3 characters')
    .regex(/^[a-z0-9._-]+$/i, 'Letters, numbers, dots, dashes or underscores'),
  password: z
    .string()
    .min(8, 'Use at least 8 characters')
    .regex(/[A-Za-z]/, 'Include a letter')
    .regex(/\d/, 'Include a number'),
});

export const appointmentSchema = z.object({
  patientId: optionalText(z.coerce.number().int().positive()),
  serviceId: z.coerce.number({ error: 'Choose a service' }).int().positive('Choose a service'),
  staffId: optionalText(z.coerce.number().int().positive()),
  dateTime: z
    .string()
    .min(1, 'Pick a date and time')
    .refine((v) => new Date(v).getTime() > Date.now(), 'Pick a time in the future')
    .refine((v) => {
      const h = new Date(v).getHours();
      return h >= 8 && h < 20;
    }, 'The center is open 08:00–20:00'),
  notes: optionalText(z.string().trim().max(255)),
});

export const orderSchema = z.object({
  patientId: z.coerce.number({ error: 'Choose a patient' }).int().positive('Choose a patient'),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']),
  serviceIds: z.array(z.number()).min(1, 'Add at least one test'),
  icd10Code: optionalText(
    z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-TV-Z]\d{2}(\.[0-9A-Z]{1,4})?$/, 'Use an ICD-10 code like J18.9'),
  ),
  diagnosisText: optionalText(z.string().trim().max(255)),
});

export const paymentSchema = (balance) =>
  z.object({
    amount: z.coerce
      .number({ error: 'Enter an amount' })
      .positive('Amount must be greater than zero')
      .max(balance, `The remaining balance is ${balance.toFixed(2)} EGP`),
    method: z.enum(['CASH', 'CARD', 'INSURANCE']),
  });

export const reportSchema = z.object({
  findings: z.string().trim().min(5, 'Describe the findings'),
  impression: z.string().trim().min(3, 'Add an impression'),
});

// Returns { data } on success or { errors: { field: message } }.
export function check(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return { data: result.data, errors: {} };
  const errors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.');
    if (!errors[key]) errors[key] = issue.message;
  }
  return { data: null, errors };
}
