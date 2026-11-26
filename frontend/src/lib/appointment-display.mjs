// Safe display helpers for incomplete and heterogeneous appointment API responses.
// Never fabricate missing healthcare relationship data or render '#undefined'.
const nonEmpty=(v)=>v!==undefined&&v!==null&&String(v).trim()!=='';
const first=(...items)=>items.find(nonEmpty);
const clean=(v)=>nonEmpty(v)?String(v).trim():null;
const fullname=(r)=>first(r?.fullName,r?.name,r?.displayName,r?.user?.fullName,r?.user?.name,r?.profile?.fullName,r?.account?.fullName);
const getId=(r)=>first(r?.id,r?.staffId,r?.userId);
const label=(obj,prefix)=>clean(fullname(obj))||`${prefix} #${getId(obj)??'unknown'}`;
export const appointmentStatus=r=>clean(r?.status)?.toUpperCase()||'UNKNOWN';
export function appointmentView(r,{patients=[],staff=[],services=[]}={}){
  const patientId=first(r?.patientId,r?.patient?.id,r?.patient?.patientId);
  const doctorId=first(r?.staffId,r?.staff?.id,r?.doctorId,r?.doctor?.id,r?.doctor?.staffId,r?.doctorStaffId,r?.staffId,r?.providerId,r?.provider?.id);
  const serviceId=first(r?.serviceId,r?.service?.id);
  const found=(list,id)=>nonEmpty(id)?list.find(x=>String(getId(x))===String(id)):null;
  const patient=first(fullname(r?.patient),fullname(found(patients,patientId)),nonEmpty(patientId)?`Patient #${patientId}`:null)||'Not returned by API';
  const doctor=first(fullname(r?.staff),fullname(r?.doctor),fullname(r?.provider),fullname(r?.practitioner),fullname(found(staff,doctorId)),nonEmpty(doctorId)?`Doctor #${doctorId}`:null)||'Not returned by API';
  const service=first(r?.service?.name,r?.service?.displayName,found(services,serviceId)?.name,nonEmpty(serviceId)?`Service #${serviceId}`:null)||'Not returned by API';
  const date=first(r?.dateTime,r?.scheduledAt,r?.startTime,r?.appointmentDate);
  let when='Not returned by API';
  if(nonEmpty(date)){const d=new Date(date);when=Number.isNaN(d.getTime())?'Invalid date in API':d.toLocaleString();}
  return {patient,doctor,service,when,status:appointmentStatus(r),doctorId};
}
export function appointmentNeedsReview(r,lookups={}){return appointmentView(r,lookups).doctor==='Not returned by API'}
export function appointmentMatches(r,query,lookups={}){
  const q=String(query||'').trim().toLowerCase();if(!q)return true;
  const v=appointmentView(r,lookups);
  return [r?.id,v.patient,v.doctor,v.service,v.when,v.status].some(x=>String(x??'').toLowerCase().includes(q));
}
export function appointmentConflict(records,doctorId,dateTime){
  const inputDate=new Date(dateTime);
  if(!nonEmpty(doctorId)||Number.isNaN(inputDate.getTime()))return false;
  return (records||[]).some(r=>{
    const id=first(r?.staffId,r?.staff?.id,r?.staffId,r?.staff?.id,r?.doctorId,r?.doctor?.id,r?.doctor?.staffId);
    const when=first(r?.dateTime,r?.scheduledAt,r?.startTime);
    return String(id)===String(doctorId)&&
      !['CANCELLED','COMPLETED','NO_SHOW'].includes(appointmentStatus(r))&&
      nonEmpty(when)&&Math.abs(new Date(when).getTime()-inputDate.getTime())<30*60000;
  });
}
