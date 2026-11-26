import { test } from 'node:test';
import assert from 'node:assert/strict';
import {asList,can,numberId,routes} from '../src/lib/data.mjs';

test('normalizes supported backend collection responses',()=>{assert.deepEqual(asList([{id:1}]),[{id:1}]);assert.deepEqual(asList({items:[{id:2}]}),[{id:2}]);assert.deepEqual(asList(null),[])});
test('rejects invalid numeric identifiers',()=>{assert.equal(numberId('5'),5);assert.equal(numberId('0'),null);assert.equal(numberId('abc'),null)});
test('billing is hidden from clinicians in navigation',()=>{assert.equal(can('DOCTOR',routes.find(x=>x.id==='billing').roles),false);assert.equal(can('ADMIN',routes.find(x=>x.id==='billing').roles),true)});
test('imaging reports and clinical rule alerts are separate from AI inference',()=>{assert.equal(routes.some(x=>x.id==='ai'),false)});
