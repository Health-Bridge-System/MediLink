import React, {useEffect, useState} from 'react';
import {api} from '../lib/api.js';

const fromDate=(value)=>value?String(value).slice(0,10):'';
export default function PatientProfileEditor({token,patient,onSaved}) {
  const [form,setForm]=useState({});
  const [saving,setSaving]=useState(false),[notice,setNotice]=useState('');
  useEffect(()=>{
    setForm({fullName:patient?.fullName||'',birthDate:fromDate(patient?.birthDate),gender:patient?.gender||'MALE',
      phone:patient?.phone||'',email:patient?.email||'',address:patient?.address||''});setNotice('');
  },[patient?.id,patient?.updatedAt]);
  if(!patient?.id)return null;
  const update=async e=>{
    e.preventDefault();setSaving(true);setNotice('');
    try {
      if(!form.birthDate||new Date(`${form.birthDate}T00:00:00Z`).getTime()>Date.now())throw new Error('Choose a valid date of birth');
      const body={fullName:form.fullName.trim(),birthDate:`${form.birthDate}T00:00:00.000Z`,gender:form.gender,
        phone:form.phone.trim()||undefined,email:form.email.trim()||undefined,address:form.address.trim()||undefined};
      const updated=await api(`/patients/${patient.id}`,{token,method:'PATCH',body});
      setNotice('Patient profile updated.');onSaved?.(updated);
    }catch(err){setNotice(`Error: ${err.message}`)}finally{setSaving(false)}
  };
  return <section className="ml-record-box ml-editor"><h3>Edit demographics — Patient #{patient.id}</h3>
    <p className="ml-small">The national ID is immutable here. Use the approved identity-correction process for a legal ID change.</p>
    <form onSubmit={update}>
      <div className="ml-formgrid">
        <label className="ml-field"><span>Full name</span><input required minLength={3} maxLength={120} value={form.fullName||''} onChange={e=>setForm({...form,fullName:e.target.value})}/></label>
        <label className="ml-field"><span>Date of birth</span><input required type="date" value={form.birthDate||''} onChange={e=>setForm({...form,birthDate:e.target.value})}/></label>
        <label className="ml-field"><span>Gender</span><select value={form.gender||'MALE'} onChange={e=>setForm({...form,gender:e.target.value})}><option value="MALE">Male</option><option value="FEMALE">Female</option></select></label>
        <label className="ml-field"><span>Telephone</span><input type="tel" pattern="\+?[0-9]{8,15}" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label className="ml-field"><span>Email</span><input type="email" maxLength={120} value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></label>
        <label className="ml-field"><span>Address</span><input maxLength={255} value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></label>
      </div>
      <button className="ml-button primary" disabled={saving} type="submit">{saving?'Updating…':'Save patient details'}</button>
    </form>
    {notice&&<div role={notice.startsWith('Error:')?'alert':'status'} className={`ml-notice ${notice.startsWith('Error:')?'error':'success'}`}>{notice}</div>}
  </section>;
}
