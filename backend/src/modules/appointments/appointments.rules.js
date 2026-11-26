// Server-side appointment lifecycle policy. No record is hard-deleted.
export const APPOINTMENT_TRANSITIONS = Object.freeze({
  SCHEDULED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
  CHECKED_IN: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
});
export function canTransitionAppointment(from, to) {
  return Boolean(APPOINTMENT_TRANSITIONS[from]?.includes(to));
}
export function mayRescheduleAppointment(status) {
  return status === 'SCHEDULED';
}
export function overlapsAppointmentSlot(a, b, minutes=30) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) < minutes * 60000;
}
