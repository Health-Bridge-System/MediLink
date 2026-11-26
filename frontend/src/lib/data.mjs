export const asList = (data) => Array.isArray(data) ? data : Array.isArray(data?.items) ? data.items : Array.isArray(data?.data) ? data.data : Array.isArray(data?.results) ? data.results : [];
export const display = (value) => value === null || value === undefined || value === '' ? '—' : typeof value === 'object' ? JSON.stringify(value) : String(value);
export const numberId = (s) => {const n=Number(s);return Number.isSafeInteger(n)&&n>0?n:null};
export const can = (role, roles) => !roles || roles.includes(role);
export const routes = [
  {id:'overview',title:'Overview',roles:null},
  {id:'patients',title:'Patients',roles:['ADMIN','DOCTOR','RECEPTIONIST','PATIENT']},
  {id:'appointments',title:'Appointments',roles:['ADMIN','DOCTOR','RECEPTIONIST','PATIENT']},
  {id:'clinical',title:'Clinical records',roles:['DOCTOR']},
  {id:'orders',title:'Diagnostic orders',roles:['ADMIN','DOCTOR','RECEPTIONIST','LAB_TECH','RADIOLOGIST']},
  {id:'lab',title:'Laboratory worklist',roles:['LAB_TECH','ADMIN','DOCTOR']},
  {id:'imaging',title:'Imaging reports',roles:['RADIOLOGIST','DOCTOR','ADMIN','PATIENT']},
  {id:'services',title:'Services',roles:['ADMIN','DOCTOR','RECEPTIONIST','LAB_TECH','RADIOLOGIST']},
  {id:'billing',title:'Billing',roles:['ADMIN']},
  {id:'alerts',title:'Rule-based alerts',roles:['ADMIN','DOCTOR','LAB_TECH','RADIOLOGIST']},
  {id:'reports',title:'Operational reports',roles:['ADMIN','DOCTOR','LAB_TECH','RADIOLOGIST']},
  {id:'hl7',title:'HL7 messages',roles:['ADMIN']},
  {id:'audit',title:'Audit trail',roles:['ADMIN']},
  {id:'staff',title:'Staff',roles:['ADMIN','DOCTOR','RECEPTIONIST']},
  {id:'guide',title:'Workflow guide',roles:null},
];
export const formatDate = (v) => v ? new Date(v).toLocaleString() : '—';
export const friendlyError = (error) => (error?.message || String(error || 'Unknown error'));
