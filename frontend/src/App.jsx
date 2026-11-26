import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {api, urlQuery} from './lib/api.js';
import {asList, can, display, formatDate, numberId, routes} from './lib/data.mjs';
import {makeAppointmentPayload, dateOnly} from './lib/appointments.mjs';
import {appointmentView, appointmentMatches, appointmentNeedsReview, appointmentStatus, appointmentConflict} from './lib/appointment-display.mjs';
import './styles/appointment-quality.css';
import PatientProfileEditor from './components/PatientProfileEditor.jsx';
import PatientHistorySections from './components/PatientHistorySections.jsx';
import OperatingGuide from './components/OperatingGuide.jsx';
import ClinicalRecords from './components/ClinicalRecords.jsx';
import {matches,staffName,patientName,moneyValue,resultsFromAnalytes,safeOrderSelection} from './lib/workflow-quality.mjs';
import './styles/workflow-quality.css';

function Action({children, onClick, disabled=false, kind='normal', type='button'}) { return <button type={type} onClick={onClick} disabled={disabled} className={`ml-button ${kind}`}>{children}</button> }
function Field({label,children}) {return <label className="ml-field"><span>{label}</span>{children}</label>}
function FormGrid({children}){return <div className="ml-formgrid">{children}</div>}
function Notice({text,error=false}){return text?<div role={error?'alert':'status'} className={`ml-notice ${error?'error':'success'}`}>{text}</div>:null}
function Empty({children='No records found.'}){return <div className="ml-empty">{children}</div>}
function Pane({title,subtitle,tools,children}){return <section className="ml-pane"><div className="ml-pane-head"><div><h2>{title}</h2>{subtitle&&<p>{subtitle}</p>}</div>{tools}</div>{children}</section>}
function DataTable({rows,cols,onSelect,selected,actionLabel='View',empty='No matching records found.'}){
  if(!rows?.length)return <Empty>{empty}</Empty>;
  return <div className="ml-table-wrap"><table><thead><tr>{cols.map(c=><th scope="col" key={c.key}>{c.label}</th>)}{onSelect&&<th scope="col">Action</th>}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.id??i} className={selected===r.id?'selected':''}>{cols.map(c=><td key={c.key}>{c.render?c.render(r):display(r[c.key])}</td>)}{onSelect&&<td><button type="button" className="ml-row-action" onClick={()=>onSelect(r)} aria-label={`${actionLabel} record ${r.id??i}`}>{actionLabel}</button></td>}</tr>)}</tbody></table></div>;
}
function useResource(path,token,enabled=true){
  const [data,setData]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[version,setVersion]=useState(0);
  useEffect(()=>{if(!enabled||!path||!token){setData(null);return}
    const ctl=new AbortController();setBusy(true);setError('');
    api(path,{token:token==='public'?undefined:token,signal:ctl.signal}).then(setData).catch(e=>{if(!ctl.signal.aborted)setError(e.message)}).finally(()=>{if(!ctl.signal.aborted)setBusy(false)});
    return()=>ctl.abort();
  },[path,token,enabled,version]);
  return {data,busy,error,refresh:()=>setVersion(x=>x+1)};
}
function Health({health,refresh}){
  return <Pane title="System connectivity" subtitle="Live checks against the running Express API and database." tools={<Action onClick={refresh}>Recheck</Action>}>
    <div className="ml-metrics"><div><span>API status</span><strong>{display(health?.status)}</strong></div><div><span>Database</span><strong>{display(health?.database)}</strong></div><div><span>Last checked</span><strong>{formatDate(health?.time)}</strong></div></div>
  </Pane>;
}
function Login({onLogin,health}){
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const submit=async(e)=>{e.preventDefault();setBusy(true);setError('');try{const result=await api('/auth/login',{method:'POST',body:{username:username.trim(),password}});const token=result?.token??result?.accessToken; if(!token)throw new Error('Login response has no token');const me=await api('/auth/me',{token});onLogin({token,user:me});setPassword('')}catch(err){setError(err.message)}finally{setBusy(false)}};
  return <main className="ml-login-wrap"><div className="ml-login-brand"><div className="ml-mark">M</div><h1>MediLink</h1><p>Laboratory and Imaging Management</p><div className="ml-hero-lines"><b>Patients</b><b>Appointments</b><b>Lab results</b><b>Radiology reports</b><b>Billing</b></div><p className="ml-small">Uses actual database-backed API records. No demo-login, mock responses or generated medical findings.</p></div><form onSubmit={submit} className="ml-login-card"><p className="ml-kicker">SECURE SIGN IN</p><h2>Welcome back</h2><p>Enter the credentials assigned by your administrator.</p><Field label="Username"><input value={username} autoComplete="username" onChange={e=>setUsername(e.target.value)} required/></Field><Field label="Password"><input type="password" value={password} autoComplete="current-password" onChange={e=>setPassword(e.target.value)} required/></Field><Notice text={error} error/><Action type="submit" kind="primary" disabled={busy||!username.trim()||!password}>{busy?'Signing in…':'Sign in'}</Action><p className="ml-small">API: {health?.status==='ok'?'Connected':'Not verified'} · Session token stays in memory and is cleared when this tab reloads.</p></form></main>
}
function Dashboard({token,role}){
  const stats=useResource('/reports/dashboard',token,can(role,['ADMIN','DOCTOR','LAB_TECH','RADIOLOGIST']));
  const health=useResource('/system/health',token);
  return <div className="ml-stack"><div className="ml-heading"><h1>Operations overview</h1><p>Live system and reporting data.</p></div>{stats.error&&<Notice text={`Dashboard: ${stats.error}`} error/>}
  {stats.data&&<Pane title="Operational KPIs" tools={<Action onClick={stats.refresh}>Refresh</Action>}><div className="ml-metrics">{Object.entries(stats.data.kpis||{}).map(([name,value])=><div key={name}><span>{name.replace(/([A-Z])/g,' $1')}</span><strong>{value==null?'Restricted':display(value)}</strong></div>)}</div></Pane>}
  <Health health={health.data} refresh={health.refresh}/></div>
}
function Patients({token,role,user}){
  const list=useResource('/patients',token,role!=='PATIENT');
  const [selected,setSelected]=useState(null),[history,setHistory]=useState(null),[historyError,setHistoryError]=useState('');
  const [form,setForm]=useState({fullName:'',nationalId:'',birthDate:'',gender:'MALE',phone:'',email:''});const [saving,setSaving]=useState(false),[notice,setNotice]=useState('');
  const ownId=user?.patientId;
  const open=async(record)=>{setSelected(record);setHistory(null);setHistoryError('');try{setHistory(await api(`/patients/${record.id}/history`,{token}))}catch(e){setHistoryError(e.message)}};
  useEffect(()=>{if(role==='PATIENT'&&ownId)open({id:ownId,fullName:user?.name||'My record'})},[role,ownId,token]);
  const create=async(e)=>{e.preventDefault();setSaving(true);setNotice('');try{const body={fullName:form.fullName.trim(),nationalId:form.nationalId.trim(),gender:form.gender,birthDate:new Date(`${form.birthDate}T00:00:00Z`).toISOString(),...(form.phone?{phone:form.phone}:{}) ,...(form.email?{email:form.email}:{})};const data=await api('/patients',{token,method:'POST',body});setNotice(`Patient record #${data.id} created`);list.refresh();setForm({fullName:'',nationalId:'',birthDate:'',gender:'MALE',phone:'',email:''})}catch(err){setNotice(`Error: ${err.message}`)}finally{setSaving(false)}};
  const canCreate=can(role,['ADMIN','RECEPTIONIST']);
  return <div className="ml-stack"><div className="ml-heading"><h1>Patients</h1><p>Access-controlled medical records from the database.</p></div><Notice text={list.error} error/>
    {canCreate&&<Pane title="Register patient"><form onSubmit={create}><FormGrid><Field label="Full name"><input required minLength={2} value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})}/></Field><Field label="National ID"><input required inputMode="numeric" pattern="[0-9]{14}" maxLength={14} value={form.nationalId} onChange={e=>setForm({...form,nationalId:e.target.value})}/></Field><Field label="Date of birth"><input type="date" required value={form.birthDate} onChange={e=>setForm({...form,birthDate:e.target.value})}/></Field><Field label="Gender"><select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option>MALE</option><option>FEMALE</option></select></Field><Field label="Phone (optional)"><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></Field><Field label="Email (optional)"><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></Field></FormGrid><Action type="submit" kind="primary" disabled={saving}>{saving?'Saving…':'Register patient'}</Action></form><Notice text={notice} error={notice.startsWith('Error:')}/></Pane>}
    {role!=='PATIENT'&&<Pane title="Patient directory" tools={<Action onClick={list.refresh}>Refresh</Action>}>{list.busy?'Loading…':<DataTable rows={asList(list.data)} cols={[{key:'id',label:'ID'},{key:'fullName',label:'Name'},{key:'nationalId',label:'National ID'},{key:'birthDate',label:'Birth date',render:r=>dateOnly(r.birthDate)}]} selected={selected?.id} onSelect={open}/>}</Pane>}
    {selected&&<Pane title={`Patient history — #${selected.id}`}><Notice text={historyError} error/>{history&&can(role,['ADMIN','RECEPTIONIST','PATIENT'])&&<PatientProfileEditor token={token} patient={history.patient} onSaved={updated=>{setSelected(updated);open(updated);list.refresh()}}/>}{history?<PatientHistorySections history={history} role={role}/>:<p>Loading history…</p>}</Pane>}
  </div>;
}
function Services({token,role}){
  const resource=useResource('/services',token),[query,setQuery]=useState(''),[type,setType]=useState('ALL');
  const [form,setForm]=useState({name:'',type:'LAB',modality:'CR',price:''});
  const [edit,setEdit]=useState(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const records=asList(resource.data);
  const visible=records.filter(r=>(type==='ALL'||r.type===type)&&matches(r,query,['id','name','type','modality']));
  const administrator=role==='ADMIN';
  const create=async e=>{e.preventDefault();setBusy(true);setNotice('');
    try{await api('/services',{token,method:'POST',body:{name:form.name.trim(),type:form.type,...(form.type==='RADIOLOGY'?{modality:form.modality}:{}),price:Number(form.price)}});
      setNotice('Service added to the catalog.');setForm({name:'',type:'LAB',modality:'CR',price:''});resource.refresh()}
    catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)};
  };
  const save=async e=>{e.preventDefault();setBusy(true);setNotice('');
    try{await api(`/services/${edit.id}`,{token,method:'PATCH',body:{name:edit.name.trim(),price:Number(edit.price)}});
      setNotice(`Service #${edit.id} updated. Existing invoices are not repriced.`);setEdit(null);resource.refresh()}
    catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)};
  };
  return <div className="ml-stack"><div className="ml-heading"><h1>Diagnostic service catalog</h1><p>Manage the diagnostic procedures available for appointments and orders.</p></div>
  {administrator&&<Pane title="Add a service" subtitle="Only administrators can modify the catalog. A price is a catalog amount, not a payment.">
    <form onSubmit={create}><FormGrid>
      <Field label="Name"><input required minLength={2} maxLength={100} value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></Field>
      <Field label="Category"><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="LAB">Laboratory</option><option value="RADIOLOGY">Radiology</option></select></Field>
      {form.type==='RADIOLOGY'&&<Field label="Modality"><select value={form.modality} onChange={e=>setForm({...form,modality:e.target.value})}>{['CR','DX','CT','MR','US'].map(v=><option key={v} value={v}>{v}</option>)}</select></Field>}
      <Field label="Price (EGP)"><input required type="number" min="0.01" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></Field>
    </FormGrid><Action type="submit" kind="primary" disabled={busy||!form.name.trim()||Number(form.price)<=0}>{busy?'Saving…':'Create service'}</Action></form>
  </Pane>}
  <Pane title="Service catalog" tools={<Action onClick={resource.refresh}>Refresh</Action>}>
    <FormGrid><Field label="Search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search by name, category or modality"/></Field><Field label="Category"><select value={type} onChange={e=>setType(e.target.value)}><option value="ALL">All</option><option value="LAB">Laboratory</option><option value="RADIOLOGY">Radiology</option></select></Field></FormGrid>
    <Notice text={resource.error} error/>{resource.busy?<p role="status">Loading…</p>:<><p className="ml-small">Showing {visible.length} of {records.length} services</p><DataTable rows={visible} onSelect={administrator?record=>setEdit({...record,price:String(record.price)}):undefined} actionLabel="Edit" selected={edit?.id} cols={[{key:'id',label:'ID'},{key:'name',label:'Service'},{key:'type',label:'Type'},{key:'modality',label:'Modality'},{key:'price',label:'Price (EGP)',render:r=>moneyValue({price:r.price})}]}/></>}
  </Pane>
  {administrator&&edit&&<Pane title={`Edit service #${edit.id}`} tools={<Action onClick={()=>setEdit(null)}>Close</Action>}>
    <p className="ml-small">Type and modality cannot be changed in the current backend. Edit the name and catalog price only.</p>
    <form onSubmit={save}><FormGrid><Field label="Name"><input required minLength={2} maxLength={100} value={edit.name} onChange={e=>setEdit({...edit,name:e.target.value})}/></Field><Field label="New price (EGP)"><input required type="number" step="0.01" min="0.01" value={edit.price} onChange={e=>setEdit({...edit,price:e.target.value})}/></Field></FormGrid>
      <Action type="submit" kind="primary" disabled={busy||Number(edit.price)<=0}>{busy?'Updating…':'Save changes'}</Action></form>
  </Pane>}
  <Notice text={notice} error={notice.startsWith('Error:')}/>
  <p className="ml-safe-note">The API supports creating and updating services. Deactivation/versioning is not yet implemented; removing historical services is intentionally unavailable.</p>
  </div>;
}
function Orders({token,role}){
  const orders=useResource('/orders',token),services=useResource('/services',token),patients=useResource('/patients',token,role==='DOCTOR');
  const [patientId,setPatientId]=useState(''),[priority,setPriority]=useState('ROUTINE'),[chosen,setChosen]=useState([]),[selected,setSelected]=useState(null),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [query,setQuery]=useState(''),[status,setStatus]=useState('ALL');
  const serviceRows=asList(services.data),patientRows=asList(patients.data),orderRows=asList(orders.data);
  const statuses=[...new Set(orderRows.map(o=>o.status).filter(Boolean))].sort();
  const filtered=orderRows.filter(o=>(status==='ALL'||o.status===status)&&matches(o,query,['id','patientId','priority','status']));
  const create=async(e)=>{e.preventDefault();setBusy(true);setNotice('');try{const ids=safeOrderSelection(patientId,chosen);const created=await api('/orders',{token,method:'POST',body:{...ids,priority}});setNotice(`Order #${created?.id??'new'} created.`);setPatientId('');setChosen([]);orders.refresh()}catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)}};
  const load=async(row)=>{setSelected({id:row.id,loading:true});setNotice('');try{setSelected(await api(`/orders/${row.id}`,{token}))}catch(e){setNotice(`Error: ${e.message}`);setSelected(null)}};
  const cancel=async()=>{if(!selected||!window.confirm(`Cancel order #${selected.id}? In-progress items will be marked CANCELLED, but completed records are retained.`))return;
    setBusy(true);setNotice('');try{await api(`/orders/${selected.id}/cancel`,{token,method:'PATCH'});setNotice(`Order #${selected.id} cancelled.`);setSelected(null);orders.refresh()}
    catch(e){setNotice(`Error: ${e.message}`)}finally{setBusy(false)}};
  return <div className="ml-stack"><div className="ml-heading"><h1>Diagnostic orders</h1><p>Clinician-initiated laboratory and imaging requests, tracked from order placement to results.</p></div>
    {role!=='DOCTOR'&&<Pane title="Ordering permissions"><p>Only a doctor is authorized to create a diagnostic order in the current backend. This role may view only the records the API allows. Sign in as a doctor to place orders.</p></Pane>}
    {role==='DOCTOR'&&<Pane title="Create diagnostic order" subtitle="Select an existing patient and one or more approved procedures. These requests are stored in the real database."><Notice text={patients.error||services.error} error/>
      <form onSubmit={create}><FormGrid><Field label="Patient"><select value={patientId} required onChange={e=>setPatientId(e.target.value)}><option value="">Select a patient</option>{patientRows.map(p=><option key={p.id} value={p.id}>{patientName(p)} (#{p.id})</option>)}</select></Field>
      <Field label="Priority"><select value={priority} onChange={e=>setPriority(e.target.value)}><option value="ROUTINE">Routine</option><option value="URGENT">Urgent</option><option value="STAT">STAT</option></select></Field></FormGrid>
      <fieldset className="ml-service-choice"><legend>Requested services</legend>{serviceRows.length?<div className="ml-checkboxes">{serviceRows.map(service=><label key={service.id}><input type="checkbox" checked={chosen.includes(service.id)} onChange={e=>setChosen(prev=>e.target.checked?[...prev,service.id]:prev.filter(id=>id!==service.id))}/><span>{service.name} · {service.type} · listed price {moneyValue({price:service.price})}</span></label>)}</div>:<Empty>No services configured for ordering.</Empty>}</fieldset>
      <div className="ml-actionbar"><Action type="submit" kind="primary" disabled={busy||patients.busy||services.busy||!patientId||!chosen.length}>{busy?'Placing order…':'Place order'}</Action><span>{chosen.length} service{chosen.length===1?'':'s'} selected</span></div></form><Notice text={notice} error={notice.startsWith('Error:')}/>
    </Pane>}
    <Pane title="Order register" subtitle="Search applies to loaded records; use View to inspect the order's real line items." tools={<Action onClick={orders.refresh}>Refresh</Action>}>
      <FormGrid><Field label="Search orders"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Order ID, patient ID, priority"/></Field><Field label="Status"><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All statuses</option>{statuses.map(s=><option key={s} value={s}>{s}</option>)}</select></Field></FormGrid><Notice text={orders.error} error/>
      {orders.busy?<p role="status">Loading orders…</p>:<><p className="ml-small">{filtered.length} of {orderRows.length} orders</p><DataTable rows={filtered} onSelect={load} selected={selected?.id} cols={[{key:'id',label:'Order ID'},{key:'patientId',label:'Patient ID'},{key:'priority',label:'Priority'},{key:'status',label:'Status'},{key:'createdAt',label:'Created',render:r=>formatDate(r.createdAt)}]}/></>}
    </Pane>
    {selected&&<Pane title={`Order #${selected.id}`} tools={<Action onClick={()=>setSelected(null)}>Close details</Action>}>
      {selected.loading?<p role="status">Loading order details…</p>:<><div className="ml-record-grid"><div className="ml-record-box"><h3>Order summary</h3><p>Patient: {selected.patient?.fullName??(selected.patientId!=null?`#${selected.patientId}`:'Not returned')}</p><p>Priority: {display(selected.priority)} · Status: {display(selected.status)}</p><p>Created: {formatDate(selected.createdAt)}</p></div></div>
      <h3>Requested services</h3><DataTable rows={selected.items||[]} cols={[{key:'id',label:'Item ID'},{key:'status',label:'Processing status'},{key:'service',label:'Diagnostic service',render:r=>display(r.service?.name??r.serviceId)}]}/>
      {['ADMIN','DOCTOR'].includes(role)&&!['COMPLETED','CANCELLED'].includes(selected.status)&&<div className="ml-actionbar"><Action kind="danger" disabled={busy} onClick={cancel}>{busy?'Cancelling…':'Cancel active order'}</Action><span>Completed results cannot be erased.</span></div>}</>}

    </Pane>}
  </div>;
}
function Lab({token,role}){
 const [filter,setFilter]=useState('ORDERED'),[query,setQuery]=useState('');
 const resource=useResource(`/orders/worklist${urlQuery({type:'LAB',status:filter})}`,token);
 const [active,setActive]=useState(null),[values,setValues]=useState({}),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
 const entries=asList(resource.data).filter(r=>matches(r,query,['id','orderId','status',r=>r.service?.name]));
 const start=async(item)=>{setBusy(true);setNotice('');try{await api(`/orders/items/${item.id}/start`,{token,method:'PATCH'});setNotice(`Item #${item.id} started`);setActive(null);resource.refresh()}catch(e){setNotice(`Error: ${e.message}`)}finally{setBusy(false)}};
 const submit=async(e)=>{e.preventDefault();setBusy(true);setNotice('');try{const rows=resultsFromAnalytes(active?.service?.analytes,values);await api(`/results/items/${active.id}`,{token,method:'POST',body:{values:rows}});setNotice(`Verified results recorded for item #${active.id}`);setActive(null);setValues({});resource.refresh()}catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)}};
 const open=item=>{setActive(item);setValues({});setNotice('')};
 return <div className="ml-stack"><div className="ml-heading"><h1>Laboratory worklist</h1><p>Each worklist item is a specific ordered laboratory procedure. Measurements are entered by authorized technicians, never generated by the UI.</p></div>
 <div className="ml-workflow-steps"><div><strong>1 · Ordered</strong><span>Doctor requests a lab procedure</span></div><div><strong>2 · In progress</strong><span>Lab processes and verifies sample</span></div><div><strong>3 · Completed</strong><span>Results are saved and released through the API</span></div></div>
 {role!=='LAB_TECH'&&<Pane title="Processing access"><p>Only laboratory technicians may start procedures and enter measured results. Your account can review authorized records but cannot submit lab values.</p></Pane>}
 <Pane title="Worklist" subtitle="Filter by processing stage. Select View to inspect an item." tools={<Action onClick={resource.refresh}>Refresh</Action>}>
 <FormGrid><Field label="Work stage"><select value={filter} onChange={e=>{setFilter(e.target.value);setActive(null)}}><option value="ORDERED">Awaiting work</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option></select></Field><Field label="Search visible worklist"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Item, order, or test name"/></Field></FormGrid>
 <Notice text={resource.error} error/>{resource.busy?<p role="status">Loading worklist…</p>:<DataTable rows={entries} onSelect={open} selected={active?.id} empty="No laboratory items match the selected stage or search." cols={[{key:'id',label:'Item ID'},{key:'orderId',label:'Order ID'},{key:'service',label:'Test',render:r=>display(r.service?.name??r.serviceId)},{key:'status',label:'Stage'}]}/>}</Pane><Notice text={notice} error={notice.startsWith('Error:')}/>
 {active&&<Pane title={`Laboratory item #${active.id}`} tools={<Action onClick={()=>setActive(null)}>Close details</Action>}><p>Service: <strong>{display(active.service?.name)}</strong> · Status: <strong>{display(active.status)}</strong></p>
 {active.status==='COMPLETED'&&<p className="ml-safe-note">This item is completed. Existing results must be amended through an audited correction process, not entered twice.</p>}
 {role==='LAB_TECH'&&active.status==='ORDERED'&&<Action disabled={busy} onClick={()=>start(active)}>Start verified lab work</Action>}
 {role==='LAB_TECH'&&active.status==='IN_PROGRESS'&&<form onSubmit={submit}><p className="ml-safe-note">Enter measurements from a verified laboratory source. All analytes must have a numeric result before submission. Do not enter guessed values.</p><FormGrid>{(active.service?.analytes||[]).map(a=><Field key={a.testName} label={`${a.testName}${a.unit?' ('+a.unit+')':''}`}><input type="number" step="any" required value={values[a.testName]??''} onChange={e=>setValues({...values,[a.testName]:e.target.value})}/></Field>)}</FormGrid><Action type="submit" kind="primary" disabled={busy||!active.service?.analytes?.length}>{busy?'Submitting…':'Submit verified measurements'}</Action></form>}
 </Pane>}
 </div>;
}
function Imaging({token,role,user}){
  const list=useResource('/imaging/studies',token,role!=='PATIENT');
  const [id,setId]=useState(null),[study,setStudy]=useState(null),[note,setNote]=useState(''),[findings,setFindings]=useState(''),[impression,setImpression]=useState(''),[busy,setBusy]=useState(false);
  const load=async(s)=>{setId(s.id);setNote('');setStudy(null);try{const r=await api(`/imaging/studies/${s.id}`,{token});setStudy(r);setFindings(r.report?.findings||'');setImpression(r.report?.impression||'')}catch(e){setNote(`Error: ${e.message}`)}};
  const save=async(status)=>{if(status==='FINAL'&&!window.confirm('Signing a FINAL report is irreversible. Continue?'))return;setBusy(true);setNote('');try{const r=await api(`/imaging/studies/${id}/report`,{token,method:'PUT',body:{findings,impression,status}});setStudy(r);setNote(`Report ${status==='FINAL'?'signed':'saved as draft'}`);list.refresh()}catch(e){setNote(`Error: ${e.message}`)}finally{setBusy(false)}};
  if(role==='PATIENT')return <Pane title="Imaging reports"><p>Access to an imaging report is permitted only through your patient history, after the radiologist signs it.</p></Pane>;
  return <div className="ml-stack"><div className="ml-heading"><h1>Imaging reports</h1><p>Manage study metadata and signed radiology reports. Real image loading is intentionally excluded until DICOM integration.</p></div><Pane title="Studies" tools={<Action onClick={list.refresh}>Refresh</Action>}><Notice text={list.error} error/><DataTable rows={asList(list.data)} onSelect={load} selected={id} cols={[{key:'id',label:'Study ID'},{key:'dicomStudyUid',label:'Study UID'},{key:'item',label:'Service',render:r=>r.item?.service?.name},{key:'report',label:'Report',render:r=>r.report?.status||'Not created'},{key:'performedAt',label:'Performed',render:r=>formatDate(r.performedAt)}]}/></Pane>
    {id&&<Pane title={`Study #${id}`}><Notice text={note} error={note.startsWith('Error:')}/>{!study?'Loading…':<><p>Patient: {study.item?.order?.patient?.fullName} · UID: {study.dicomStudyUid}</p><p className="ml-warning">DICOM images are not displayed here. Do not interpret or sign real clinical findings without reviewing images through a validated imaging system.</p>{study.series?.length>0&&<DataTable rows={study.series} cols={[{key:'id',label:'Series ID'},{key:'modality',label:'Modality'},{key:'bodyPart',label:'Anatomy'},{key:'numInstances',label:'Instances'}]}/>}
      {role==='RADIOLOGIST'&&study.report?.status!=='FINAL'?<div className="ml-formgrid"><Field label="Findings"><textarea rows={5} value={findings} onChange={e=>setFindings(e.target.value)}/></Field><Field label="Impression"><textarea rows={5} value={impression} onChange={e=>setImpression(e.target.value)}/></Field><div className="ml-actions"><Action disabled={busy} onClick={()=>save('DRAFT')}>Save draft</Action><Action disabled={busy||!findings.trim()||!impression.trim()} kind="danger" onClick={()=>save('FINAL')}>Sign FINAL report</Action></div></div>:<div className="ml-record-box"><h3>{study.report?.status==='FINAL'?'Final report':'Radiology report'}</h3><p><strong>Findings:</strong> {study.report?.findings||'No report'}</p><p><strong>Impression:</strong> {study.report?.impression||'—'}</p></div>}
    </>}</Pane>}
  </div>;
}
function Appointments({token,role,user}){
  const resource=useResource('/appointments',token);
  const canBook=can(role,['ADMIN','RECEPTIONIST','DOCTOR','PATIENT']);
  const patients=useResource('/patients',token,canBook&&role!=='PATIENT');
  const staff=useResource('/staff',token,canBook||role==='ADMIN');
  const services=useResource('/services',token,canBook||role==='ADMIN');
  const [form,setForm]=useState({patientId:'',doctorId:'',serviceId:'',dateTime:'',reason:''});
  const [notice,setNotice]=useState(''),[busy,setBusy]=useState(false);
  const [query,setQuery]=useState(''),[statusFilter,setStatusFilter]=useState('ALL');
  const [selected,setSelected]=useState(null),[newDate,setNewDate]=useState('');
  const patientRows=asList(patients.data),staffRows=asList(staff.data),serviceRows=asList(services.data);
  const doctors=staffRows.filter(r=>r.role==='DOCTOR');
  const appointments=asList(resource.data);
  const records=appointments.filter(r=>(statusFilter==='ALL'||appointmentStatus(r)===statusFilter)&&appointmentMatches(r,query,{patients:patientRows,staff:staffRows,services:serviceRows}))
    .sort((a,b)=>new Date(a.dateTime||0)-new Date(b.dateTime||0));
  const statuses=[...new Set(appointments.map(appointmentStatus))].sort();
  const unresolved=appointments.filter(r=>appointmentNeedsReview(r,{staff:staffRows})).length;
  const possibleClash=form.doctorId&&form.dateTime?appointmentConflict(appointments,form.doctorId,form.dateTime):false;
  const localMin=(()=>{const d=new Date(Date.now()+60000);return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,16)})();
  const create=async e=>{
    e.preventDefault();setNotice('');setBusy(true);
    try{const body=makeAppointmentPayload(form,{patientBooking:role==='PATIENT'});
      if(new Date(body.dateTime).getTime()<=Date.now())throw new Error('Choose a future time.');
      const result=await api('/appointments',{token,method:'POST',body});
      setNotice(`Appointment #${result.id} scheduled.`);setForm({patientId:'',doctorId:'',serviceId:'',dateTime:'',reason:''});resource.refresh();
    }catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)};
  };
  const changeStatus=async status=>{
    if(!selected)return;
    if(status==='CANCELLED'&&!window.confirm('Cancel this appointment? The record and audit trail will be preserved.'))return;
    setBusy(true);setNotice('');
    try{const result=await api(`/appointments/${selected.id}/status`,{token,method:'PATCH',body:{status}});
      setSelected(result);setNotice(`Appointment #${selected.id} changed to ${status.replaceAll('_',' ')}.`);resource.refresh();
    }catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)};
  };
  const reschedule=async e=>{
    e.preventDefault();if(!selected||!newDate)return;
    if(!window.confirm('Confirm moving this appointment to the selected date/time?'))return;
    setBusy(true);setNotice('');
    try{const dateTime=new Date(newDate);if(!Number.isFinite(dateTime.getTime())||dateTime<=new Date())throw new Error('Select a valid future time.');
      const result=await api(`/appointments/${selected.id}/reschedule`,{token,method:'PATCH',body:{dateTime:dateTime.toISOString()}});
      setSelected(result);setNewDate('');setNotice('Appointment rescheduled.');resource.refresh();
    }catch(err){setNotice(`Error: ${err.message}`)}finally{setBusy(false)};
  };
  const presentation=r=>appointmentView(r,{patients:patientRows,staff:staffRows,services:serviceRows});
  const transitions=selected?(role==='PATIENT'?(selected.status==='SCHEDULED'?['CANCELLED']:[]):({SCHEDULED:['CHECKED_IN','CANCELLED','NO_SHOW'],CHECKED_IN:['COMPLETED']}[selected.status]||[])):[];
  return <div className="ml-stack ml-appointments">
    <div className="ml-heading"><h1>Appointments</h1><p>Scheduling, arrival tracking, cancellation and rescheduling. Appointments are retained rather than deleted.</p></div>
    <div className="ml-appointment-summary" aria-label="Appointment summary">
      <div><small>Loaded bookings</small><strong>{appointments.length}</strong></div>
      <div><small>Scheduled</small><strong>{appointments.filter(r=>appointmentStatus(r)==='SCHEDULED').length}</strong></div>
      <div><small>Completed</small><strong>{appointments.filter(r=>appointmentStatus(r)==='COMPLETED').length}</strong></div>
      <div><small>Cancelled</small><strong>{appointments.filter(r=>appointmentStatus(r)==='CANCELLED').length}</strong></div>
    </div>
    {canBook&&<Pane title="Book an appointment" subtitle="Use existing services and clinician schedules. All times display in your computer's local timezone.">
      <Notice text={patients.error||staff.error||services.error} error/>
      <form onSubmit={create}><FormGrid>
        {role==='PATIENT'?<div className="ml-safe-note">Booking for your own patient account.</div>:<Field label="Patient"><select required value={form.patientId} onChange={e=>setForm({...form,patientId:e.target.value})}><option value="">Choose a patient</option>{patientRows.map(p=><option key={p.id} value={p.id}>{patientName(p)} (#{p.id})</option>)}</select></Field>}
        <Field label="Doctor"><select required value={form.doctorId} onChange={e=>setForm({...form,doctorId:e.target.value})}><option value="">Choose a doctor</option>{doctors.map(d=><option key={d.id} value={d.id}>{staffName(d)} (#{d.id})</option>)}</select></Field>
        <Field label="Service"><select required value={form.serviceId} onChange={e=>setForm({...form,serviceId:e.target.value})}><option value="">Choose a service</option>{serviceRows.map(v=><option key={v.id} value={v.id}>{v.name} — {v.type}</option>)}</select></Field>
        <Field label="Date and time"><input type="datetime-local" required min={localMin} value={form.dateTime} onChange={e=>setForm({...form,dateTime:e.target.value})}/></Field>
        <Field label="Notes (optional)"><input maxLength={255} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})}/></Field>
      </FormGrid>
      {possibleClash&&<div className="ml-appointment-warning">Potential 30-minute scheduling conflict for this doctor. The backend performs a further check.</div>}
      <Action type="submit" kind="primary" disabled={busy||!doctors.length||!serviceRows.length||(!form.patientId&&role!=='PATIENT')}>{busy?'Booking…':'Book appointment'}</Action></form>
    </Pane>}
    <Notice text={notice} error={notice.startsWith('Error:')}/>
    <Pane title="Appointment register" tools={<Action onClick={resource.refresh}>Refresh</Action>}>
      <Notice text={resource.error} error/>
      {unresolved>0&&<p className="ml-appointment-warning">{unresolved} booking(s) have no assigned clinician. “Unassigned” is not a software error; assign a doctor when creating future bookings.</p>}
      <div className="ml-appointment-filters"><Field label="Search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Patient, doctor, service, ID"/></Field>
        <Field label="Status"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="ALL">All statuses</option>{statuses.map(st=><option key={st} value={st}>{st.replaceAll('_',' ')}</option>)}</select></Field></div>
      <p className="ml-small">Showing {records.length} of {appointments.length} loaded appointments</p>
      {resource.busy?<p>Loading…</p>:<DataTable rows={records} onSelect={setSelected} selected={selected?.id} cols={[{key:'id',label:'ID'},{key:'patient',label:'Patient',render:r=>presentation(r).patient},{key:'doctor',label:'Doctor',render:r=>presentation(r).doctor},{key:'service',label:'Service',render:r=>presentation(r).service},{key:'dateTime',label:'Date / time',render:r=>presentation(r).when},{key:'status',label:'Status'}]}/>}
    </Pane>
    {selected&&<Pane title={`Appointment #${selected.id}`} tools={<Action onClick={()=>setSelected(null)}>Close details</Action>}>
      <div className="ml-appointment-detail">{Object.entries({Patient:presentation(selected).patient,Doctor:presentation(selected).doctor,Service:presentation(selected).service,Time:presentation(selected).when,Status:selected.status,Notes:selected.notes||'—'}).map(([label,val])=><div key={label}><small>{label}</small><strong>{val}</strong></div>)}</div>
      {transitions.length>0&&<div className="ml-actionbar">{transitions.map(st=><Action key={st} kind={st==='CANCELLED'?'danger':'normal'} disabled={busy} onClick={()=>changeStatus(st)}>{st==='CANCELLED'?'Cancel appointment':st.replaceAll('_',' ')}</Action>)}</div>}
      {selected.status==='SCHEDULED'&&<form onSubmit={reschedule} className="ml-actionbar"><Field label="Reschedule to"><input type="datetime-local" required min={localMin} value={newDate} onChange={e=>setNewDate(e.target.value)}/></Field><Action type="submit" disabled={busy||!newDate}>Reschedule</Action></form>}
      <p className="ml-safe-note">Completed and cancelled appointments remain in history. Appointment actions are role-restricted and audited by the backend. Deletion is intentionally unavailable.</p>
    </Pane>}
  </div>;
}
function ResourceTable({token,title,path,cols,subtitle,filter}){
  const resource=useResource(path,token),[query,setQuery]=useState('');
  const entries=useMemo(()=>asList(resource.data).filter(v=>matches(v,query,Object.keys(v||{}).filter(k=>typeof v?.[k]!=='object'))),[resource.data,query]);
  return <Pane title={title} subtitle={subtitle} tools={<Action onClick={resource.refresh}>Refresh</Action>}>
   <Field label="Search loaded records"><input placeholder="Search visible records" value={query} onChange={e=>setQuery(e.target.value)}/></Field>
   <Notice text={resource.error} error/>{resource.busy?<p role="status">Loading records…</p>:<><p className="ml-small">{entries.length} of {asList(resource.data).length} records · Local filter (not a server-side search)</p><DataTable rows={entries} cols={cols}/></>}
  </Pane>;
}
function Reports({token,role}){const data=useResource('/reports/dashboard',token);return <Pane title="Operational reporting" subtitle="Figures are returned by the backend and restricted by role." tools={<Action onClick={data.refresh}>Refresh</Action>}><Notice text={data.error} error/>{data.data?<div className="ml-stack">{Object.entries(data.data).map(([k,v])=><div key={k} className="ml-record-box"><h3>{k}</h3>{Array.isArray(v)? <DataTable rows={v} cols={Object.keys(v[0]||{}).slice(0,6).map(key=>({key,label:key}))}/>:typeof v==='object'&&v? <div className="ml-metrics">{Object.entries(v).map(([a,b])=><div key={a}><span>{a}</span><strong>{b===null?'Restricted':display(b)}</strong></div>)}</div>:<p>{display(v)}</p>}</div>)}</div>:<Empty>No reporting data available.</Empty>}</Pane>}
function Billing({token}){
 const invoices=useResource('/invoices',token),[query,setQuery]=useState(''),[status,setStatus]=useState('ALL');
 const [selected,setSelected]=useState(null),[loading,setLoading]=useState(false),[paying,setPaying]=useState(false),[notice,setNotice]=useState('');
 const [payment,setPayment]=useState({amount:'',method:'CASH'});
 const records=asList(invoices.data),statuses=[...new Set(records.map(r=>r.paymentStatus).filter(Boolean))].sort();
 const filtered=records.filter(r=>(status==='ALL'||r.paymentStatus===status)&&matches(r,query,['id','orderId','paymentStatus',r=>r.patient?.fullName]));
 const load=async row=>{setLoading(true);setNotice('');try{const detail=await api(`/invoices/${row.id}`,{token});setSelected(detail);setPayment({amount:'',method:'CASH'})}catch(e){setNotice(`Error: ${e.message}`)}finally{setLoading(false)}};
 const paidCents=selected?.payments?.reduce((sum,row)=>sum+Math.round(Number(row.amount)*100),0)||0;
 const balanceCents=selected?Math.max(0,Math.round(Number(selected.total)*100)-paidCents):0;
 const pay=async e=>{e.preventDefault();if(!selected)return;
   const cents=Math.round(Number(payment.amount)*100);
   if(!Number.isSafeInteger(cents)||cents<1||cents>balanceCents){setNotice('Error: Enter a valid amount no greater than the outstanding balance.');return;}
   if(!window.confirm(`Record a ${payment.method} payment of ${(cents/100).toFixed(2)} EGP against invoice #${selected.id}?`))return;
   setPaying(true);setNotice('');try{const updated=await api(`/invoices/${selected.id}/payments`,{token,method:'POST',body:{amount:cents/100,method:payment.method}});setSelected(updated);setPayment({amount:'',method:'CASH'});setNotice(`Payment recorded against invoice #${selected.id}.`);invoices.refresh()}
   catch(err){setNotice(`Error: ${err.message}`)}finally{setPaying(false)};
 };
 return <div className="ml-stack"><div className="ml-heading"><h1>Billing & invoices</h1><p>Itemized balances and recorded payments. Administration access only.</p></div>
 <div className="ml-quality-metrics"><div><small>Loaded invoices</small><strong>{records.length}</strong></div><div><small>Unpaid</small><strong>{records.filter(r=>r.paymentStatus==='UNPAID').length}</strong></div><div><small>Paid or partial</small><strong>{records.filter(r=>r.paymentStatus!=='UNPAID').length}</strong></div></div>
 <Pane title="Invoice register" tools={<Action onClick={invoices.refresh}>Refresh</Action>}>
  <FormGrid><Field label="Find invoice"><input value={query} placeholder="Invoice, order, patient" onChange={e=>setQuery(e.target.value)}/></Field>
  <Field label="Payment status"><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">All</option>{statuses.map(st=><option key={st} value={st}>{st}</option>)}</select></Field></FormGrid>
  <Notice text={invoices.error} error/>{invoices.busy?<p>Loading…</p>:<DataTable rows={filtered} onSelect={load} selected={selected?.id} cols={[{key:'id',label:'Invoice'},{key:'patient',label:'Patient',render:r=>r.patient?.fullName||`#${r.patientId}`},{key:'orderId',label:'Order'},{key:'total',label:'Total (EGP)',render:r=>moneyValue({total:r.total})},{key:'paymentStatus',label:'Status'},{key:'createdAt',label:'Issued',render:r=>formatDate(r.createdAt)}]}/>}
 </Pane>
 <Notice text={notice} error={notice.startsWith('Error:')}/>
 {loading&&<p role="status">Loading invoice details…</p>}
 {selected&&<Pane title={`Invoice #${selected.id}`} tools={<Action onClick={()=>setSelected(null)}>Close</Action>}>
   <div className="ml-quality-metrics"><div><small>Invoiced (EGP)</small><strong>{moneyValue({total:selected.total})}</strong></div><div><small>Payments (EGP)</small><strong>{(paidCents/100).toFixed(2)}</strong></div><div><small>Balance (EGP)</small><strong>{(balanceCents/100).toFixed(2)}</strong></div></div>
   <h3>Invoice line items</h3><DataTable rows={selected.items||[]} cols={[{key:'id',label:'Line'},{key:'orderItem',label:'Service',render:r=>r.orderItem?.service?.name||`#${r.orderItemId}`},{key:'price',label:'Price (EGP)',render:r=>moneyValue({price:r.price})}]}/>
   <h3>Recorded payments</h3><DataTable rows={selected.payments||[]} cols={[{key:'id',label:'Payment'},{key:'amount',label:'Amount (EGP)',render:r=>moneyValue({total:r.amount})},{key:'method',label:'Method'},{key:'paidAt',label:'Date',render:r=>formatDate(r.paidAt)}]}/>
   {balanceCents>0&&<form className="ml-payment-form" onSubmit={pay}><h3>Record payment</h3><FormGrid>
     <Field label="Amount (EGP)"><input type="number" min="0.01" max={(balanceCents/100).toFixed(2)} step="0.01" required value={payment.amount} onChange={e=>setPayment({...payment,amount:e.target.value})}/></Field>
     <Field label="Method"><select value={payment.method} onChange={e=>setPayment({...payment,method:e.target.value})}><option value="CASH">Cash</option><option value="CARD">Card (externally confirmed)</option><option value="INSURANCE">Insurance (externally confirmed)</option></select></Field>
     </FormGrid><Action type="submit" kind="primary" disabled={paying||!payment.amount}>{paying?'Recording…':'Record confirmed payment'}</Action>
     <p className="ml-safe-note">This records an already-confirmed payment; it does not charge a bank card or submit an insurance claim. Verify settlement independently. Refunds are not implemented.</p></form>}
 </Pane>}
 </div>;
}
function Audit({token}){
  return <ResourceTable title="Audit trail" subtitle="Security-sensitive operations, recorded by the backend." path="/audit" token={token} cols={[{key:'id',label:'ID'},{key:'action',label:'Action'},{key:'tableName',label:'Entity'},{key:'recordId',label:'Record'},{key:'user',label:'Actor',render:r=>r.user?.username||'System'},{key:'loggedAt',label:'Timestamp',render:r=>formatDate(r.loggedAt)}]}/>;
}
function App(){
  const [session,setSession]=useState(null),[active,setActive]=useState('overview'),[notice,setNotice]=useState('');
  const health=useResource('/system/health','public');
  const role=session?.user?.role;
  const nav=routes.filter(r=>can(role,r.roles));
  useEffect(()=>{if(session&&!nav.some(r=>r.id===active))setActive('overview')},[role,session,active]);
  const render=()=>{
    if(active==='overview')return <Dashboard token={session.token} role={role}/>;
    if(active==='patients')return <Patients token={session.token} role={role} user={session.user}/>;
    if(active==='appointments')return <Appointments token={session.token} role={role} user={session.user}/>;
    if(active==='orders')return <Orders token={session.token} role={role}/>;
    if(active==='lab')return <Lab token={session.token} role={role}/>;
    if(active==='imaging')return <Imaging token={session.token} role={role} user={session.user}/>;
    if(active==='services')return <Services token={session.token} role={role}/>;
    if(active==='reports')return <Reports token={session.token} role={role}/>;
    if(active==='clinical')return <ClinicalRecords token={session.token}/>;
    if(active==='guide')return <OperatingGuide/>;
    if(active==='staff')return <ResourceTable token={session.token} title="Staff directory" path="/staff" cols={[{key:'id',label:'Staff ID'},{key:'fullName',label:'Name'},{key:'role',label:'Role'}]}/>;
    if(active==='billing')return <Billing token={session.token}/>;
    if(active==='alerts')return <ResourceTable token={session.token} title="Rule-based clinical alerts" subtitle="Generated from laboratory thresholds and duplicate-order rules; not AI diagnoses." path="/cdss/alerts?page=1&pageSize=50" cols={[{key:'severity',label:'Severity'},{key:'message',label:'Message'},{key:'itemId',label:'Order item'},{key:'createdAt',label:'Created',render:r=>formatDate(r.createdAt)}]}/>;
    if(active==='hl7')return <ResourceTable token={session.token} title="HL7 message log" subtitle="Stored HL7 messages and acknowledgements. ACKED does not by itself prove delivery to an external EMR receiver." path="/hl7/messages?page=1&pageSize=50" cols={[{key:'id',label:'ID'},{key:'messageType',label:'Type'},{key:'orderId',label:'Order'},{key:'status',label:'Status'},{key:'createdAt',label:'Created',render:r=>formatDate(r.createdAt)}]}/>;
    if(active==='audit')return <Audit token={session.token}/>;
    return null;
  };
  if(!session)return <Login health={health.data} onLogin={s=>{setSession(s);setActive('overview')}}/>;
  return <div className="ml-app"><aside className="ml-sidebar"><div className="ml-logo"><div className="ml-mark small">M</div><div><strong>MediLink</strong><span>Clinical operations</span></div></div><div className="ml-user"><strong>{session.user?.fullName||session.user?.name||session.user?.username||'Signed in'}</strong><span>{role}</span></div><nav aria-label="Main menu">{nav.map(item=><button key={item.id} className={active===item.id?'active':''} onClick={()=>{setActive(item.id);setNotice('')}}>{item.title}</button>)}</nav><div className="ml-sidebar-bottom">Authenticated session · operational QA build</div></aside><div className="ml-main"><header className="ml-top"><div><b>{routes.find(x=>x.id===active)?.title||'MediLink'}</b><small>Live API and MySQL data</small></div><div className="ml-top-actions"><span className={health.data?.status==='ok'?'ml-status good':'ml-status'}>{health.data?.status==='ok'?'API connected':'API unverified'}</span><Action onClick={()=>{setSession(null);setNotice('');setActive('overview')}}>Sign out</Action></div></header><main className="ml-body"><Notice text={notice}/>{render()}</main><footer>Operational interface for the course project. Real DICOM and imaging AI are out of scope. This QA build is not approved for clinical or commercial deployment.</footer></div></div>;
}
export default App;
