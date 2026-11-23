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

test('health check reaches the database', async () => {
  const res = await api.request('GET', '/system/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('wrong password is rejected with a generic message', async () => {
  const res = await api.request('POST', '/auth/login', { body: { username: 'admin', password: 'wrong-password' } });
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Wrong username or password');
});

test('protected routes need a token', async () => {
  const res = await api.request('GET', '/patients');
  assert.equal(res.status, 401);
});

test('invalid input returns field-level validation errors', async () => {
  const token = await api.tokenFor('reception.rania');
  const res = await api.request('POST', '/patients', { token, body: { fullName: 'x', nationalId: '12', gender: 'M' } });
  assert.equal(res.status, 400);
  const fields = res.body.details.map((d) => d.path);
  for (const f of ['fullName', 'nationalId', 'birthDate', 'gender']) assert.ok(fields.includes(f), `missing error for ${f}`);
});

test('/auth/me returns the signed-in user', async () => {
  const token = await api.tokenFor('dr.salma');
  const res = await api.request('GET', '/auth/me', { token });
  assert.equal(res.status, 200);
  assert.equal(res.body.role, 'DOCTOR');
});
