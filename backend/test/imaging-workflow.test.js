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

// Doctor orders a chest X-ray -> radiologist stores the study -> CDSS
// suggestion -> report signed -> patient sees only the final report.
test('imaging order runs from acquisition to signed report', async () => {
  const doctor = await api.tokenFor('dr.nour');
  const radiologist = await api.tokenFor('rad.youssef');

  const services = await api.request('GET', '/services?type=RADIOLOGY', { token: doctor });
  const cxr = services.body.find((s) => s.modality === 'CR');
  const patient = await api.tokenFor('aya.mahmoud');
  const me = await api.request('GET', '/auth/me', { token: patient });

  const order = await api.request('POST', '/orders', { token: doctor, body: { patientId: me.body.patientId, priority: 'URGENT', serviceIds: [cxr.id] } });
  assert.equal(order.status, 201);
  const itemId = order.body.items[0].id;

  const study = await api.request('POST', '/imaging/studies', {
    token: radiologist,
    body: { itemId, series: [{ bodyPart: 'CHEST', description: 'PA view' }] },
  });
  assert.equal(study.status, 201);
  assert.match(study.body.dicomStudyUid, /^2\.25\.\d+$/);
  assert.equal(study.body.cdssResults.length, 1, 'CDSS should analyse the stored study');

  const reviewed = await api.request('PATCH', `/cdss/results/${study.body.cdssResults[0].id}/review`, { token: radiologist, body: { reviewStatus: 'ACCEPTED' } });
  assert.equal(reviewed.body.reviewStatus, 'ACCEPTED');

  const draft = await api.request('PUT', `/imaging/studies/${study.body.id}/report`, { token: radiologist, body: { findings: 'Draft text', status: 'DRAFT' } });
  assert.equal(draft.body.report.status, 'DRAFT');
  const hidden = await api.request('GET', `/imaging/studies/${study.body.id}`, { token: patient });
  assert.equal(hidden.body.report, null, 'patients must not see drafts');

  const final = await api.request('PUT', `/imaging/studies/${study.body.id}/report`, {
    token: radiologist,
    body: { findings: 'Lungs are clear.', impression: 'Normal chest.', status: 'FINAL' },
  });
  assert.equal(final.body.report.status, 'FINAL');
  assert.equal(final.body.item.status, 'COMPLETED');

  const visible = await api.request('GET', `/imaging/studies/${study.body.id}`, { token: patient });
  assert.equal(visible.body.report.impression, 'Normal chest.');

  const locked = await api.request('PUT', `/imaging/studies/${study.body.id}/report`, { token: radiologist, body: { findings: 'x', status: 'DRAFT' } });
  assert.equal(locked.status, 400);
});
