import React from 'react';
import {dateOnly} from '../lib/appointments.mjs';
import {formatDate} from '../lib/data.mjs';

function HistoryTable({rows,columns,empty}){
  if(!rows?.length)return <p className="ml-history-empty">{empty||'No records in this section.'}</p>;
  return <div className="ml-table-wrap"><table><thead><tr>{columns.map(c=><th scope="col" key={c.label}>{c.label}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id||i}>{columns.map(c=><td key={c.label}>{c.render(r)??'—'}</td>)}</tr>)}</tbody></table></div>;
}
export default function PatientHistorySections({history,role}){
  if(!history)return null;
  const patient=history.patient;
  return <div className="ml-history-stack">
    <section className="ml-record-box"><h3>Patient identity</h3><dl className="ml-definition-grid">
      <div><dt>Name</dt><dd>{patient?.fullName||'—'}</dd></div>
      <div><dt>Patient ID</dt><dd>#{patient?.id||'—'}</dd></div>
      <div><dt>Date of birth</dt><dd>{dateOnly(patient?.birthDate)}</dd></div>
      <div><dt>Contact</dt><dd>{patient?.phone||'Not provided'}</dd></div>
    </dl></section>
    <section className="ml-record-box"><h3>Appointments</h3><HistoryTable rows={history.appointments} columns={[
      {label:'Date',render:r=>formatDate(r.dateTime)},{label:'Clinician',render:r=>r.staff?.fullName||'Not assigned'},
      {label:'Service',render:r=>r.service?.name||'—'},{label:'Status',render:r=>r.status}
    ]}/></section>
    <section className="ml-record-box"><h3>Diagnostic orders</h3><HistoryTable rows={history.orders} columns={[
      {label:'Order',render:r=>`#${r.id}`},{label:'Date',render:r=>formatDate(r.orderDate)},
      {label:'Doctor',render:r=>r.doctor?.fullName||'—'},
      {label:'Tests and studies',render:r=>(r.items||[]).map(i=>`${i.service?.name||'Test'} (${i.status})`).join(', ')||'—'},
      {label:'Status',render:r=>r.status}
    ]}/></section>
    <section className="ml-record-box"><h3>Recorded diagnoses</h3><HistoryTable rows={history.diagnoses} columns={[
      {label:'Date',render:r=>formatDate(r.diagnosedAt)},{label:'ICD-10',render:r=>r.icd10Code},
      {label:'Description',render:r=>r.description},{label:'Doctor',render:r=>r.doctor?.fullName}
    ]}/></section>
    <section className="ml-record-box"><h3>Prescriptions</h3><HistoryTable rows={history.prescriptions} columns={[
      {label:'Issued',render:r=>formatDate(r.issueDate)},{label:'Doctor',render:r=>r.doctor?.fullName},
      {label:'Items',render:r=>(r.items||[]).map(x=>x.drugName||x.medicationName||x.name).filter(Boolean).join(', ')||'See source record'}
    ]}/></section>
    {role==='ADMIN'&&<section className="ml-record-box"><h3>Patient invoices</h3><HistoryTable rows={history.invoices} columns={[
      {label:'Invoice',render:r=>`#${r.id}`},{label:'Total',render:r=>String(r.total)},
      {label:'Payment status',render:r=>r.paymentStatus}
    ]}/></section>}
  </div>;
}
