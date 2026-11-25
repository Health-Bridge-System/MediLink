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

test('billing is for administrators only', async () => {
  for (const user of ['reception.rania', 'dr.salma', 'aya.mahmoud']) {
    const res = await api.request('GET', '/invoices', { token: await api.tokenFor(user) });
    assert.equal(res.status, 403, `${user} should not see billing`);
  }
  const admin = await api.request('GET', '/invoices', { token: await api.tokenFor('admin') });
  assert.equal(admin.status, 200);
});

test('non-admins get no revenue figures on the dashboard', async () => {
  const doctor = await api.request('GET', '/reports/dashboard', { token: await api.tokenFor('dr.salma') });
  assert.equal(doctor.body.kpis.revenueMonth, null);
  assert.equal(doctor.body.revenueByMonth, null);
  const admin = await api.request('GET', '/reports/dashboard', { token: await api.tokenFor('admin') });
  assert.equal(typeof admin.body.kpis.revenueMonth, 'number');
});

test("a patient can open their own record but not someone else's", async () => {
  const token = await api.tokenFor('aya.mahmoud');
  const me = await api.request('GET', '/auth/me', { token });
  const own = await api.request('GET', `/patients/${me.body.patientId}/history`, { token });
  assert.equal(own.status, 200);
  assert.deepEqual(own.body.invoices, []);
  const other = await api.request('GET', `/patients/${me.body.patientId + 1}/history`, { token });
  assert.equal(other.status, 403);
});

test('only lab technicians can enter lab results', async () => {
  const res = await api.request('POST', '/results/items/1', { token: await api.tokenFor('rad.youssef'), body: { values: [{ testName: 'WBC', value: 5 }] } });
  assert.equal(res.status, 403);
});
