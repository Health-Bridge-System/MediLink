import {test} from 'node:test';
import assert from 'node:assert/strict';
import {matches,staffName,patientName,moneyValue,resultsFromAnalytes,safeOrderSelection} from '../src/lib/workflow-quality.mjs';
test('display safe names without undefined',()=>{assert.equal(staffName({id:4,user:{fullName:'Dr. Salma'}}),'Dr. Salma');assert.equal(patientName({id:1,fullName:'Aya'}),'Aya');assert.equal(staffName({id:8}),'Staff #8');});
test('search supports case insensitive ID, labels and nested extractor',()=>{assert.ok(matches({id:8,name:'Blood panel'},'BLood',['id','name']));assert.ok(matches({service:{name:'MRI'}},'mri',[r=>r.service.name]));assert.equal(matches({name:'MRI'},'CT',['name']),false);});
test('money display never invents a currency or amount',()=>{assert.equal(moneyValue({totalAmount:'150.00'}),'150.00');assert.equal(moneyValue({}),'Not supplied');});
test('result submission rejects blanks, NaN and Infinity',()=>{assert.throws(()=>resultsFromAnalytes([{testName:'Potassium'}],{'Potassium':''}),/Enter/);assert.throws(()=>resultsFromAnalytes([{testName:'Potassium'}],{'Potassium':'Infinity'}),/finite/);assert.deepEqual(resultsFromAnalytes([{testName:'Potassium'}],{'Potassium':'4.3'}),[{testName:'Potassium',value:4.3}]);});
test('orders require positive identifiers and deduplicate services',()=>{assert.deepEqual(safeOrderSelection('6',['1','1','2']),{patientId:6,serviceIds:[1,2]});assert.throws(()=>safeOrderSelection('',[1]),/Choose a patient/);assert.throws(()=>safeOrderSelection(6,[0]),/valid diagnostic/);});
