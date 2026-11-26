import {test} from 'node:test';
import assert from 'node:assert/strict';
import {preparePrescription} from '../src/lib/clinical.mjs';
test('clinical form maps patient and manually entered prescription fields',()=>{
 const p=preparePrescription('3',[{drugName:' Amoxicillin ',dose:'500 mg',frequency:'twice per day',durationDays:'5'}],' test note ');
 assert.equal(p.patientId,3);assert.equal(p.items[0].drugName,'Amoxicillin');assert.equal(p.items[0].durationDays,5);
 assert.equal(p.notes,'test note');
});
test('clinical form refuses empty medication names and malformed duration',()=>{
 assert.throws(()=>preparePrescription(3,[{drugName:''}]),/medicine name/);
 assert.throws(()=>preparePrescription(3,[{drugName:'Some medicine',durationDays:'Infinity'}]),/Duration/);
});
