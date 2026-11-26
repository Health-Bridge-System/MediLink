import { test } from 'node:test';
import assert from 'node:assert/strict';
import { APPOINTMENT_TRANSITIONS,canTransitionAppointment,mayRescheduleAppointment,overlapsAppointmentSlot } from '../src/modules/appointments/appointments.rules.js';
import { AppointmentsService } from '../src/modules/appointments/appointments.service.js';

test('appointment transitions are one-way and terminal states stay terminal',()=>{
  assert.equal(canTransitionAppointment('SCHEDULED','CHECKED_IN'),true);
  assert.equal(canTransitionAppointment('SCHEDULED','CANCELLED'),true);
  assert.equal(canTransitionAppointment('CHECKED_IN','COMPLETED'),true);
  for(const status of ['COMPLETED','CANCELLED','NO_SHOW']){
    assert.deepEqual(APPOINTMENT_TRANSITIONS[status],[]);
    assert.equal(mayRescheduleAppointment(status),false);
  }
  assert.equal(canTransitionAppointment('COMPLETED','SCHEDULED'),false);
  assert.equal(canTransitionAppointment('SCHEDULED','COMPLETED'),false);
});

test('30-minute slots overlap but bookings exactly 30 minutes apart do not',()=>{
  assert.equal(overlapsAppointmentSlot('2030-01-01T12:00:00Z','2030-01-01T12:29:00Z'),true);
  assert.equal(overlapsAppointmentSlot('2030-01-01T12:00:00Z','2030-01-01T12:30:00Z'),false);
});

test('patients cannot update status of another patient booking',async()=>{
  const fakePrisma={appointment:{findUnique:async()=>({id:3,patientId:5,status:'SCHEDULED'})}};
  const service=new AppointmentsService({prisma:fakePrisma,events:{}});
  await assert.rejects(service.updateStatus({role:'PATIENT',patientId:7},3,'CANCELLED'),{status:403});
});

test('status cannot move directly from scheduled to completed',async()=>{
  const fakePrisma={appointment:{findUnique:async()=>({id:3,patientId:5,status:'SCHEDULED'})}};
  const service=new AppointmentsService({prisma:fakePrisma,events:{}});
  await assert.rejects(service.updateStatus({role:'ADMIN'},3,'COMPLETED'),{status:400});
});

test('cancellation is blocked when appointment already has a linked order',async()=>{
  const fakePrisma={appointment:{findUnique:async()=>({id:3,patientId:5,status:'SCHEDULED',order:{id:2}})}};
  const service=new AppointmentsService({prisma:fakePrisma,events:{}});
  await assert.rejects(service.updateStatus({role:'ADMIN'},3,'CANCELLED'),{status:400});
});
