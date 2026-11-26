// MediLink appointment payload preparation. Pure logic, no API calls.
const positiveId=(value,label)=>{
  const n=Number(value);
  if(!Number.isSafeInteger(n)||n<1)throw new Error(`Choose a valid ${label}.`);
  return n;
};
export function makeAppointmentPayload(form,{patientBooking=false}={}){
  const patientId=patientBooking?undefined:positiveId(form.patientId,'patient');
  const staffId=positiveId(form.doctorId,'doctor');
  const serviceId=positiveId(form.serviceId,'service');
  if(!form.dateTime || typeof form.dateTime!=='string')throw new Error('Select an appointment date and time.');
  const date=new Date(form.dateTime);
  if(!Number.isFinite(date.getTime()))throw new Error('Select a valid appointment date and time.');
  return {...(patientBooking?{}:{patientId}),staffId,serviceId,dateTime:date.toISOString(),...(form.reason?.trim()?{notes:form.reason.trim().slice(0,255)}:{})};
}
// Date-of-birth is a calendar date, not a local datetime.
export function dateOnly(value){
  if(!value)return '—';
  const dt=new Date(value);
  return Number.isFinite(dt.getTime())?dt.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'}):String(value);
}
