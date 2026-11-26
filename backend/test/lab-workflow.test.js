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

// Doctor orders a metabolic panel -> lab tech enters a critical potassium ->
// CDSS alert, HL7 ORU^R01, order completed and invoice created.
test('lab order runs from order to invoice', async () => {
  const doctor = await api.tokenFor('dr.omar');
  const lab = await api.tokenFor('lab.karim');
  const admin = await api.tokenFor('admin');

  const services = await api.request('GET', '/services?type=LAB', { token: doctor });
  const bmp = services.body.find((s) => s.name === 'Basic Metabolic Panel');

  const created = await api.request('POST', '/orders', {
    token: doctor,
    body: { patientId: 5, priority: 'STAT', serviceIds: [bmp.id], diagnosis: { icd10Code: 'i10', description: 'Hypertension' } },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.status, 'ORDERED');
  assert.equal(created.body.diagnoses[0].icd10Code, 'I10');
  const itemId = created.body.items[0].id;

  const started = await api.request('PATCH', `/orders/items/${itemId}/start`, { token: lab });
  assert.equal(started.status, 200);

  const values = bmp.analytes.map((a) => ({ testName: a.testName, value: a.testName === 'Potassium' ? 6.9 : 1 }));
  values.find((v) => v.testName === 'Sodium').value = 140;
  values.find((v) => v.testName === 'Glucose').value = 90;
  const saved = await api.request('POST', `/results/items/${itemId}`, { token: lab, body: { values } });
  assert.equal(saved.status, 201);
  assert.equal(saved.body.results.find((r) => r.testName === 'Potassium').flag, 'CRITICAL');
  assert.ok(saved.body.alerts.some((a) => a.severity === 'CRITICAL'));
  assert.equal(saved.body.orderStatus, 'COMPLETED');

  const order = await api.request('GET', `/orders/${created.body.id}`, { token: admin });
  assert.equal(order.body.invoice.paymentStatus, 'UNPAID');

  const messages = await api.request('GET', '/hl7/messages?messageType=ORU^R01&pageSize=5', { token: admin });
  assert.ok(messages.body.items.some((m) => m.orderId === created.body.id && m.status === 'ACKED'));
});

test('a result cannot be entered twice', async () => {
  const lab = await api.tokenFor('lab.karim');
  const done = await api.request('GET', '/orders/worklist?type=LAB&status=COMPLETED', { token: lab });
  const res = await api.request('POST', `/results/items/${done.body[0].id}`, { token: lab, body: { values: [{ testName: 'WBC', value: 5 }] } });
  assert.equal(res.status, 400);
});

// Booked visit -> order from that appointment -> last result entered ->
// the appointment closes by itself.
test('an appointment is completed when its order is finished', async () => {
  const reception = await api.tokenFor('reception.rania');
  const doctor = await api.tokenFor('dr.omar');
  const lab = await api.tokenFor('lab.karim');

  const services = await api.request('GET', '/services?type=LAB', { token: doctor });
  const cbc = services.body.find((s) => s.name === 'Complete Blood Count') ?? services.body[0];
  const when = new Date();
  when.setDate(when.getDate() + 1);
  when.setHours(10, 0, 0, 0);

  const booked = await api.request('POST', '/appointments', {
    token: reception,
    body: { patientId: 6, serviceId: cbc.id, dateTime: when.toISOString() },
  });
  assert.equal(booked.status, 201);

  const order = await api.request('POST', '/orders', {
    token: doctor,
    body: { patientId: 6, appointmentId: booked.body.id, serviceIds: [cbc.id] },
  });
  assert.equal(order.status, 201);
  const itemId = order.body.items[0].id;

  await api.request('PATCH', `/orders/items/${itemId}/start`, { token: lab });
  const values = cbc.analytes.map((a) => ({ testName: a.testName, value: 5 }));
  const saved = await api.request('POST', `/results/items/${itemId}`, { token: lab, body: { values } });
  assert.equal(saved.status, 201, JSON.stringify(saved.body));
  assert.equal(saved.body.orderStatus, 'COMPLETED');

  const list = await api.request('GET', '/appointments?patientId=6&pageSize=100', { token: reception });
  const visit = list.body.items.find((a) => a.id === booked.body.id);
  assert.equal(visit.status, 'COMPLETED');
});
