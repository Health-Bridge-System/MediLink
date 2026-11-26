import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeAppointmentPayload,dateOnly} from '../src/lib/appointments.mjs';
test('create appointment sends actual backend fields',()=>{
  const out=makeAppointmentPayload({patientId:'6',doctorId:'4',serviceId:'2',dateTime:'2026-11-30T17:31',reason:'Follow up'});
  assert.deepEqual([out.patientId,out.staffId,out.serviceId],[6,4,2]);
  assert.equal(out.dateTime,new Date('2026-11-30T17:31').toISOString());
  assert.equal(out.notes,'Follow up');
  assert.ok(!Object.hasOwn(out,'scheduledAt')); assert.ok(!Object.hasOwn(out,'doctorId')); assert.ok(!Object.hasOwn(out,'reason'));
});
test('invalid service and date cannot submit',()=>{
  const b={patientId:'1',doctorId:'4',serviceId:'',dateTime:'2026-11-30T17:31'};
  assert.throws(()=>makeAppointmentPayload(b),/service/);
  assert.throws(()=>makeAppointmentPayload({...b,serviceId:2,dateTime:'bad-date'}),/date/);
});
test('date of birth remains date only independent of timezone',()=>{
  const d=dateOnly('2002-05-14T00:00:00.000Z');
  assert.match(d,/2002/);assert.doesNotMatch(d,/AM|PM|:/);
});

test('patient self booking omits patient ID but includes doctor and service',()=>{const body=makeAppointmentPayload({doctorId:4,serviceId:2,dateTime:'2030-05-01T14:00'},{patientBooking:true});assert.equal(body.staffId,4);assert.equal(body.patientId,undefined);});
