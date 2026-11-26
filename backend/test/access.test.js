import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { disconnectPrisma, startServer } from './helpers.js';

let api;
before(async () => {
  api = await startServer();
});
after(async () => {
  await api.stop();
  await disconnectPrisma();
});

test('billing is handled by the front desk and administrators', async () => {
  for (const user of ['dr.salma', 'lab.mona', 'aya.mahmoud']) {
    const res = await api.request('GET', '/invoices', { token: await api.tokenFor(user) });
    assert.equal(res.status, 403, `${user} should not open billing`);
  }
  for (const user of ['admin', 'reception.rania']) {
    const res = await api.request('GET', '/invoices', { token: await api.tokenFor(user) });
    assert.equal(res.status, 200, `${user} should open billing`);
  }
});

test('non-admins get no revenue figures on the dashboard', async () => {
  for (const user of ['dr.salma', 'reception.rania']) {
    const res = await api.request('GET', '/reports/dashboard', { token: await api.tokenFor(user) });
    assert.equal(res.body.kpis.revenueMonth, null);
    assert.equal(res.body.revenueByMonth, null);
  }
  const admin = await api.request('GET', '/reports/dashboard', { token: await api.tokenFor('admin') });
  assert.equal(typeof admin.body.kpis.revenueMonth, 'number');
});

test("a patient can open their own record but not someone else's", async () => {
  const token = await api.tokenFor('aya.mahmoud');
  const me = await api.request('GET', '/auth/me', { token });
  const own = await api.request('GET', `/patients/${me.body.patientId}/history`, { token });
  assert.equal(own.status, 200);
  assert.ok(own.body.invoices.every((i) => i.patientId === me.body.patientId), 'patients see only their own bills');
  const other = await api.request('GET', `/patients/${me.body.patientId + 1}/history`, { token });
  assert.equal(other.status, 403);
});

test('only lab technicians can enter lab results', async () => {
  const res = await api.request('POST', '/results/items/1', { token: await api.tokenFor('rad.youssef'), body: { values: [{ testName: 'WBC', value: 5 }] } });
  assert.equal(res.status, 403);
});
