import {test} from 'node:test';
import assert from 'node:assert/strict';
import {appointmentView,appointmentNeedsReview,appointmentMatches,appointmentConflict,appointmentStatus} from '../src/lib/appointment-display.mjs';
const staff=[{id:4,fullName:'Dr. Noor',role:'DOCTOR'},{id:9,fullName:'Dr. Hadi',role:'DOCTOR'}];
const patients=[{id:6,fullName:'Basanta'}];
const services=[{id:2,name:'Chest X-ray'}];
const lookups={staff,patients,services};
test('resolves names using related IDs from directory without undefined',()=>{
 const v=appointmentView({id:1,patientId:6,doctorId:4,serviceId:2,status:'SCHEDULED'},lookups);
 assert.equal(v.doctor,'Dr. Noor');assert.equal(v.patient,'Basanta');assert.equal(v.service,'Chest X-ray');
 assert.ok(!JSON.stringify(v).includes('undefined'));
});
test('nested doctor user name is supported',()=>assert.equal(appointmentView({doctor:{user:{fullName:'Dr. Salma'}}}).doctor,'Dr. Salma'));
test('unknown relationship is explicitly labelled, never fabricated',()=>{
 const v=appointmentView({id:1,status:'SCHEDULED'},lookups);
 assert.equal(v.doctor,'Not returned by API');assert.ok(appointmentNeedsReview({id:1},lookups));
});
test('supports alternative timestamps and role-independent filtering',()=>{
 const r={id:28,patientId:6,doctorId:9,serviceId:2,scheduledAt:'2026-12-01T10:00:00.000Z',status:'SCHEDULED'};
 assert.ok(appointmentMatches(r,'Hadi',lookups));assert.ok(appointmentMatches(r,'chest',lookups));assert.ok(appointmentMatches(r,'28',lookups));assert.equal(appointmentStatus(r),'SCHEDULED');
});
test('conflict warning only considers live doctor bookings at same time',()=>{
 const when='2026-12-01T10:00:00';
 assert.ok(appointmentConflict([{doctorId:4,dateTime:when,status:'SCHEDULED'}],4,when));
 assert.equal(appointmentConflict([{doctorId:4,dateTime:when,status:'CANCELLED'}],4,when),false);
 assert.equal(appointmentConflict([{doctorId:9,dateTime:when,status:'SCHEDULED'}],4,when),false);
});

test('actual API staff relationship is resolved and 30 minute collisions detected',()=>{const r={staffId:4,staff:{id:4,fullName:'Dr. Noor'},patientId:6,dateTime:'2029-05-01T12:00:00.000Z',status:'SCHEDULED'};assert.equal(appointmentView(r,lookups).doctor,'Dr. Noor');assert.ok(appointmentConflict([r],4,'2029-05-01T12:20:00.000Z'));});
