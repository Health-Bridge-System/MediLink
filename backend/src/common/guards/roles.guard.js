import { ForbiddenException } from '../exceptions/http.exception.js';

export const STAFF_ROLES = ['ADMIN', 'DOCTOR', 'LAB_TECH', 'RADIOLOGIST', 'RECEPTIONIST'];
export const CLINICAL_ROLES = ['DOCTOR', 'LAB_TECH', 'RADIOLOGIST'];

// Roles('DOCTOR', 'ADMIN') — must run after JwtAuthGuard.
export function Roles(...allowed) {
  return (req, _res, next) => {
    if (!allowed.includes(req.user?.role)) throw new ForbiddenException();
    next();
  };
}

// Patients may only read their own records; staff may read any patient.
export function assertPatientAccess(user, patientId) {
  if (user.role === 'PATIENT' && user.patientId !== patientId) {
    throw new ForbiddenException('Patients can only access their own records');
  }
}
