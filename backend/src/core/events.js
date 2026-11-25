// The contract between modules: event names and the payload each one carries.
// Publishers and listeners only share these names, never each other's code.
export const EVENTS = {
  /** { userId, action, tableName, recordId } */
  AUDIT: 'audit.record',
  /** { patient } */
  PATIENT_REGISTERED: 'patient.registered',
  /** { appointment } — includes patient and service */
  APPOINTMENT_BOOKED: 'appointment.booked',
  /** { order } — includes patient, doctor and items with their service */
  ORDER_PLACED: 'order.placed',
  /** { order, item, results } — order includes patient, item includes service */
  LAB_RESULTS_RECORDED: 'lab.results-recorded',
  /** { study, modality } */
  IMAGING_STUDY_STORED: 'imaging.study-stored',
  /** { order, item, report } */
  REPORT_SIGNED: 'imaging.report-signed',
  /** { orderId } — an item started, finished or was cancelled */
  ORDER_ITEM_CHANGED: 'order-item.changed',
  /** { orderId } */
  ORDER_COMPLETED: 'order.completed',
};
