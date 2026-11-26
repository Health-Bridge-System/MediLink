// Clinical form serialization ONLY. Does not recommend a diagnosis or dose.
export function preparePrescription(patientId,items,notes=''){
  const id=Number(patientId);
  if(!Number.isSafeInteger(id)||id<=0)throw new Error('Select a patient.');
  const lines=items.map(r=>({drugName:r.drugName?.trim()||'',dose:r.dose?.trim()||'',frequency:r.frequency?.trim()||'',
    ...(r.durationDays?{durationDays:Number(r.durationDays)}:{})}));
  if(!lines.length||lines.some(r=>r.drugName.length<2))throw new Error('Enter a medicine name for every line.');
  if(lines.some(r=>r.durationDays!==undefined&&(!Number.isInteger(r.durationDays)||r.durationDays<1||r.durationDays>365)))throw new Error('Duration must be 1–365 days.');
  return {patientId:id,items:lines,notes:notes.trim()};
}
