// Read-only inspection. Prints the actual local backend DTO and registered module routes.
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
const cwd=process.cwd();
for(const [name,rel] of [
 ['Appointment DTO','backend/src/modules/appointments/dto/appointment.dto.js'],
 ['Appointment routes','backend/src/modules/appointments/appointments.module.js'],
 ['Audit routes','backend/src/modules/audit/audit.module.js'],
 ['Order routes','backend/src/modules/orders/orders.module.js'],
 ['Billing routes','backend/src/modules/billing/billing.module.js'],
 ['Service routes','backend/src/modules/services/services.module.js'],
 ['Staff routes','backend/src/modules/staff/staff.module.js']]) {
  const path=resolve(cwd,rel);
  console.log(`\n=== ${name}: ${rel} ===`);
  if(!existsSync(path)){console.log('FILE MISSING');continue;}
  console.log(readFileSync(path,'utf8').split('\n').slice(0,120).join('\n'));
}
