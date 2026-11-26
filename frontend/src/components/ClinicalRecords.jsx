import React,{useState} from 'react';
import {api} from '../lib/api.js';
import {asList,formatDate} from '../lib/data.mjs';
import {dateOnly} from '../lib/appointments.mjs';
import {preparePrescription} from '../lib/clinical.mjs';

export default function ClinicalRecords({token}){
  const [patients,setPatients]=useState([]),[patientId,setPatientId]=useState(''),[history,setHistory]=useState(null);
  const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [icd,setIcd]=useState(''),[description,setDescription]=useState('');
  const [items,setItems]=useState([{drugName:'',dose:'',frequency:'',durationDays:''}]),[notes,setNotes]=useState('');
  const [loaded,setLoaded]=useState(false);
  const refresh=async()=>{setBusy(true);setNotice('');try{const list=await api('/patients',{token});setPatients(asList(list));setLoaded(true)}catch(e){setNotice(`Error: ${e.message}`)}finally{setBusy(false)}};
  const load=async id=>{setPatientId(id);setHistory(null);if(!id)return;
    try{setHistory(await api(`/patients/${id}/history`,{token}))}catch(e){setNotice(`Error: ${e.message}`)}};
  const diagnose=async e=>{e.preventDefault();setBusy(true);setNotice('');try{await api('/diagnoses',{token,method:'POST',body:{patientId:Number(patientId),icd10Code:icd.trim().toUpperCase(),description:description.trim()}});
    setNotice('Diagnosis recorded.');setIcd('');setDescription('');await load(patientId)}catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)}};
  const prescribe=async e=>{e.preventDefault();setBusy(true);setNotice('');try{const body=preparePrescription(patientId,items,notes);await api('/prescriptions',{token,method:'POST',body});
    setNotice('Prescription recorded.');setItems([{drugName:'',dose:'',frequency:'',durationDays:''}]);setNotes('');await load(patientId)}catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)}};
  const changeLine=(idx,field,value)=>setItems(current=>current.map((r,i)=>i===idx?{...r,[field]:value}:r));
  return <div className="ml-stack"><div className="ml-heading"><h1>Clinical records</h1><p>Doctor-only diagnosis and prescription entry with actual patient-linked records.</p></div>
    <section className="ml-pane"><div className="ml-pane-head"><div><h2>Patient context</h2><p>Select the correct patient before documenting any clinical entry.</p></div><button className="ml-button" onClick={refresh}>{loaded?'Refresh patients':'Load patient list'}</button></div>
    <label className="ml-field"><span>Patient</span><select value={patientId} onChange={e=>load(e.target.value)}><option value="">Select patient</option>{patients.map(r=><option key={r.id} value={r.id}>{r.fullName} · ID #{r.id}</option>)}</select></label>
    {history?.patient&&<div className="ml-safe-note"><strong>{history.patient.fullName}</strong> · DOB {dateOnly(history.patient.birthDate)} · Patient ID #{history.patient.id}</div>}
    {notice&&<div role={notice.startsWith('Error:')?'alert':'status'} className={`ml-notice ${notice.startsWith('Error:')?'error':'success'}`}>{notice}</div>}
    </section>
    {patientId&&history&&<><section className="ml-pane"><h2>Record diagnosis</h2><form onSubmit={diagnose}><div className="ml-formgrid">
      <label className="ml-field"><span>ICD-10</span><input required value={icd} placeholder="e.g. J18.9" maxLength={10} onChange={e=>setIcd(e.target.value)}/></label>
      <label className="ml-field"><span>Clinical description</span><input value={description} maxLength={255} onChange={e=>setDescription(e.target.value)}/></label>
    </div><button className="ml-button primary" type="submit" disabled={busy}>Record diagnosis</button></form>
    <h3>Previous diagnoses</h3><div className="ml-table-wrap"><table><thead><tr><th>ICD-10</th><th>Description</th><th>Date</th></tr></thead><tbody>{(history.diagnoses||[]).map(r=><tr key={r.id}><td>{r.icd10Code}</td><td>{r.description||'—'}</td><td>{formatDate(r.diagnosedAt)}</td></tr>)}</tbody></table></div></section>
    <section className="ml-pane"><h2>Record prescription</h2><p className="ml-small">Only enter a medication, dose and schedule after an authorized clinician has reviewed it. This UI does not check interactions or generate treatment recommendations.</p>
      <form onSubmit={prescribe}>{items.map((item,i)=><div key={i} className="ml-prescription-line"><div className="ml-formgrid">
        <label className="ml-field"><span>Medicine</span><input required minLength={2} maxLength={100} value={item.drugName} onChange={e=>changeLine(i,'drugName',e.target.value)}/></label>
        <label className="ml-field"><span>Dose</span><input maxLength={50} value={item.dose} onChange={e=>changeLine(i,'dose',e.target.value)}/></label>
        <label className="ml-field"><span>Frequency</span><input maxLength={50} value={item.frequency} onChange={e=>changeLine(i,'frequency',e.target.value)}/></label>
        <label className="ml-field"><span>Duration (days)</span><input type="number" min="1" max="365" value={item.durationDays} onChange={e=>changeLine(i,'durationDays',e.target.value)}/></label>
      </div>{items.length>1&&<button type="button" className="ml-button" onClick={()=>setItems(items.filter((_,j)=>j!==i))}>Remove medicine</button>}</div>)}
      <div className="ml-actionbar"><button className="ml-button" type="button" disabled={items.length>=15} onClick={()=>setItems([...items,{drugName:'',dose:'',frequency:'',durationDays:''}])}>Add medicine</button></div>
      <label className="ml-field"><span>Notes</span><textarea rows={3} value={notes} maxLength={2000} onChange={e=>setNotes(e.target.value)}/></label>
      <div className="ml-actionbar"><button className="ml-button primary" disabled={busy} type="submit">Save prescription</button></div></form>
      <h3>Previous prescriptions</h3>{(history.prescriptions||[]).map(r=><article key={r.id} className="ml-record-box"><strong>Prescription #{r.id}</strong> · {formatDate(r.issueDate)}<p>{(r.items||[]).map(x=>`${x.drugName}: ${x.dose||'no dose recorded'}`).join('; ')}</p></article>)}
    </section></>}
  </div>;
}
