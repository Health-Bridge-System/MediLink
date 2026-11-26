// Demo data for MediLink: fills all 22 ERD tables with three weeks of
// realistic (fake) activity. Safe to re-run: it wipes the tables first.
//
//   npm run db:seed
//
// Demo accounts — every account below uses the same test password:
//   DEMO_PASSWORD = "MediLink#2026"
//   admin · dr.salma · dr.omar · dr.nour · lab.mona · lab.karim
//   rad.youssef · rad.heba · reception.rania · aya.mahmoud (patient) · ...
// All names, national IDs and phone numbers are invented.

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from '../src/prisma/prisma.service.js';
import * as hl7 from '../src/modules/hl7/hl7.builder.js';
import { LAB_PANELS, computeFlag, rangeText } from '../src/common/reference/lab-panels.js';
import { labResultRules } from '../src/modules/cdss/cdss.rules.js';
import { paymentStatusFor } from '../src/modules/billing/payment-status.js';
import { dicomUid } from '../src/modules/imaging/dicom-uid.js';

const DEMO_PASSWORD = 'MediLink#2026';

// ── deterministic randomness so every teammate gets the same data ──
let seed = 20261104;
const rand = () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const between = (min, max) => min + rand() * (max - min);
const chance = (p) => rand() < p;
const hoursLater = (d, h) => new Date(d.getTime() + h * 36e5);
// Results and payments can't be in the future either.
const pastOnly = (d) => (d > Date.now() ? new Date(Date.now() - 2 * 60_000) : d);
const daysAgo = (days, hour = 9, minute = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  // "Today" events must already have happened, whatever time the seed runs.
  if (days >= 0 && d > Date.now()) return new Date(Date.now() - (hour * 25 + minute) * 60_000 / 4);
  return d;
};

// ── reference data ──
const SERVICES = [
  { name: 'Complete Blood Count (CBC)', type: 'LAB', price: 180 },
  { name: 'Basic Metabolic Panel', type: 'LAB', price: 250 },
  { name: 'Lipid Panel', type: 'LAB', price: 300 },
  { name: 'HbA1c', type: 'LAB', price: 220 },
  { name: 'Thyroid Stimulating Hormone (TSH)', type: 'LAB', price: 260 },
  { name: 'Liver Function Test', type: 'LAB', price: 320 },
  { name: 'Chest X-ray (PA)', type: 'RADIOLOGY', modality: 'CR', price: 350 },
  { name: 'Knee X-ray', type: 'RADIOLOGY', modality: 'DX', price: 300 },
  { name: 'CT Chest', type: 'RADIOLOGY', modality: 'CT', price: 1800 },
  { name: 'CT Abdomen & Pelvis', type: 'RADIOLOGY', modality: 'CT', price: 2100 },
  { name: 'MRI Brain', type: 'RADIOLOGY', modality: 'MR', price: 3200 },
  { name: 'Abdominal Ultrasound', type: 'RADIOLOGY', modality: 'US', price: 600 },
];

const STAFF = [
  { username: 'admin', fullName: 'Ahmed Tarek', role: 'ADMIN', specialty: 'Operations' },
  { username: 'dr.salma', fullName: 'Dr. Salma Hassan', role: 'DOCTOR', specialty: 'Internal Medicine' },
  { username: 'dr.omar', fullName: 'Dr. Omar Farouk', role: 'DOCTOR', specialty: 'Cardiology' },
  { username: 'dr.nour', fullName: 'Dr. Nour Adel', role: 'DOCTOR', specialty: 'Pulmonology' },
  { username: 'lab.mona', fullName: 'Mona Ibrahim', role: 'LAB_TECH', specialty: 'Clinical Pathology' },
  { username: 'lab.karim', fullName: 'Karim Mostafa', role: 'LAB_TECH', specialty: 'Hematology' },
  { username: 'rad.youssef', fullName: 'Dr. Youssef Kamal', role: 'RADIOLOGIST', specialty: 'Diagnostic Radiology' },
  { username: 'rad.heba', fullName: 'Dr. Heba Samir', role: 'RADIOLOGIST', specialty: 'Neuroradiology' },
  { username: 'reception.rania', fullName: 'Rania Adel', role: 'RECEPTIONIST', specialty: null },
];

const PATIENT_NAMES = [
  ['Aya Mahmoud', 'FEMALE'], ['Mostafa Ali', 'MALE'], ['Nadia Fathy', 'FEMALE'], ['Hossam Gamal', 'MALE'],
  ['Mariam Sherif', 'FEMALE'], ['Tamer Hosny Saleh', 'MALE'], ['Laila Mansour', 'FEMALE'], ['Khaled Nabil', 'MALE'],
  ['Dina Ragab', 'FEMALE'], ['Sherif Abdallah', 'MALE'], ['Yasmin Fouad', 'FEMALE'], ['Amr Zaki', 'MALE'],
  ['Hana Osman', 'FEMALE'], ['Mahmoud Reda', 'MALE'], ['Sara Lotfy', 'FEMALE'], ['Ibrahim Wagdy', 'MALE'],
  ['Reem Shawky', 'FEMALE'], ['Waleed Samy', 'MALE'], ['Noha Kamel', 'FEMALE'], ['Adel Barakat', 'MALE'],
  ['Farida Helmy', 'FEMALE'], ['Yehia Soliman', 'MALE'], ['Ola Badawy', 'FEMALE'], ['Hesham Naguib', 'MALE'],
];
const STREETS = ['Tahrir St, Dokki, Giza', 'Abbas El Akkad, Nasr City, Cairo', 'El Haram St, Giza', 'Corniche El Nil, Maadi, Cairo', 'Gamal Abdel Nasser, Alexandria', 'Makram Ebeid, Nasr City, Cairo', 'Mohandessin, Giza', 'Heliopolis, Cairo'];

const DIAGNOSES = [
  ['E11.9', 'Type 2 diabetes mellitus without complications'],
  ['I10', 'Essential (primary) hypertension'],
  ['E78.5', 'Hyperlipidemia, unspecified'],
  ['D64.9', 'Anemia, unspecified'],
  ['J18.9', 'Pneumonia, unspecified organism'],
  ['E03.9', 'Hypothyroidism, unspecified'],
  ['R07.4', 'Chest pain, unspecified'],
  ['K76.0', 'Fatty (change of) liver, not elsewhere classified'],
  ['M17.11', 'Unilateral primary osteoarthritis, right knee'],
  ['G43.909', 'Migraine, unspecified, not intractable'],
];

const REPORTS = {
  CR: [
    ['Lungs are clear. No focal consolidation, effusion or pneumothorax. Cardiac silhouette normal in size.', 'No acute cardiopulmonary abnormality.'],
    ['Patchy airspace opacity in the right lower zone with air bronchograms. No pleural effusion.', 'Right lower lobe pneumonia. Clinical correlation and follow-up film in 6 weeks.'],
    ['Blunting of the left costophrenic angle. Lungs otherwise clear.', 'Small left pleural effusion.'],
  ],
  DX: [['Joint space narrowing of the medial compartment with marginal osteophytes. No fracture.', 'Moderate medial compartment osteoarthritis.']],
  CT: [
    ['No pulmonary nodules or masses. No lymphadenopathy. Mild dependent atelectasis.', 'No significant abnormality.'],
    ['A 7 mm solid nodule in the right upper lobe. No lymphadenopathy.', 'Indeterminate 7 mm RUL nodule — follow-up CT in 6–12 months per Fleischner guidelines.'],
  ],
  MR: [['No intracranial mass, hemorrhage or infarct. Ventricles normal in size.', 'Normal MRI of the brain.'], ['Few small nonspecific T2/FLAIR white-matter hyperintensities.', 'Nonspecific white-matter changes, likely microvascular.']],
  US: [['Liver is enlarged with diffusely increased echogenicity. Gallbladder normal.', 'Hepatomegaly with grade II fatty infiltration.'], ['Liver, gallbladder, pancreas, spleen and kidneys appear normal.', 'Normal abdominal ultrasound.']],
};

const SERIES_PLAN = {
  CR: [{ bodyPart: 'CHEST', description: 'PA view', numInstances: 1 }, { bodyPart: 'CHEST', description: 'Lateral view', numInstances: 1 }],
  DX: [{ bodyPart: 'KNEE', description: 'AP standing', numInstances: 1 }, { bodyPart: 'KNEE', description: 'Lateral', numInstances: 1 }],
  CT: [{ bodyPart: 'CHEST', description: 'Axial 1.25 mm lung window', numInstances: 312 }, { bodyPart: 'CHEST', description: 'Axial 2.5 mm mediastinal', numInstances: 156 }],
  MR: [{ bodyPart: 'HEAD', description: 'Axial T2', numInstances: 24 }, { bodyPart: 'HEAD', description: 'Axial FLAIR', numInstances: 24 }, { bodyPart: 'HEAD', description: 'Sagittal T1', numInstances: 20 }],
  US: [{ bodyPart: 'ABDOMEN', description: 'Abdomen survey', numInstances: 38 }],
};

const CDSS_LABELS = {
  CR: ['No finding', 'Pneumonia', 'Pleural effusion', 'Cardiomegaly'],
  DX: ['No finding', 'Osteoarthritis'],
  CT: ['No finding', 'Lung nodule', 'Consolidation'],
  MR: ['No finding', 'White-matter hyperintensity'],
  US: ['No finding', 'Fatty liver'],
};

function nationalId(birth, gender, i) {
  const century = birth.getFullYear() >= 2000 ? 3 : 2;
  const yymmdd = `${String(birth.getFullYear()).slice(2)}${String(birth.getMonth() + 1).padStart(2, '0')}${String(birth.getDate()).padStart(2, '0')}`;
  const gov = pick(['01', '02', '21', '88']);
  const serial = String(1000 + i * 37).slice(-3) + (gender === 'MALE' ? 1 : 2);
  return `${century}${yymmdd}${gov}${serial}${Math.floor(rand() * 10)}`;
}

function labValue(analyte, mode) {
  const low = analyte.low ?? (analyte.high ?? 1) * 0.4;
  const high = analyte.high ?? (analyte.low ?? 1) * 2;
  let v;
  if (mode === 'critical' && analyte.critHigh) v = analyte.critHigh * between(1.02, 1.12);
  else if (mode === 'critical' && analyte.critLow) v = analyte.critLow * between(0.85, 0.98);
  else if (mode === 'abnormal') v = chance(0.6) && analyte.high ? high * between(1.08, 1.35) : low * between(0.7, 0.93);
  else v = between(low + (high - low) * 0.1, high - (high - low) * 0.1);
  const decimals = v >= 100 ? 0 : v >= 10 ? 1 : 2;
  return v.toFixed(decimals);
}

// ── HL7 helper: outbound message + the EMR simulator's inbound ACK ──
async function logHl7(messageType, build, { at, orderId = null, patientId = null }) {
  const controlId = hl7.newControlId();
  const rawMessage = build(controlId);
  await prisma.hl7Message.create({
    data: { messageType, direction: 'OUTBOUND', status: 'ACKED', controlId, rawMessage, ackCode: 'AA', orderId, patientId, sentAt: at, createdAt: at },
  });
  const ackId = hl7.newControlId();
  const ackAt = new Date(at.getTime() + 1200);
  await prisma.hl7Message.create({
    data: {
      messageType: 'ACK',
      direction: 'INBOUND',
      status: 'ACKED',
      controlId: ackId,
      rawMessage: hl7.buildAck({ originalControlId: controlId, controlId: ackId, at: ackAt }),
      ackCode: 'AA',
      orderId,
      patientId,
      sentAt: ackAt,
      createdAt: ackAt,
    },
  });
}

async function wipe() {
  // Children before parents so foreign keys never block the delete.
  const order = [
    'auditLog', 'hl7Message', 'payment', 'invoiceItem', 'invoice', 'cdssResult', 'cdssAlert', 'annotation', 'radiologyReport',
    'imagingSeries', 'imagingStudy', 'labResult', 'diagnosis', 'orderItem', 'order', 'appointment', 'prescriptionItem',
    'prescription', 'userAccount', 'service', 'patient', 'staff',
  ];
  for (const model of order) await prisma[model].deleteMany();
  // Restart auto-increment ids at 1 for readable demo ids.
  const tables = await prisma.$queryRaw`SELECT TABLE_NAME AS t FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME <> '_prisma_migrations'`;
  for (const { t } of tables) await prisma.$executeRawUnsafe(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`);
}

// Build one order and move it through its life cycle up to `stage`:
//   'ordered' | 'in_progress' | 'awaiting_report' | 'draft_report' | 'completed'
async function createOrder(ctx, { patient, doctor, services, at, priority = 'ROUTINE', stage = 'completed', diagnosis, labMode, reportPick, cdssPick, withAppointment = true }) {
  const { labTechs, radiologists } = ctx;

  let appointment = null;
  if (withAppointment) {
    appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        staffId: doctor.id,
        serviceId: services[0].id,
        dateTime: at,
        status: stage === 'completed' ? 'COMPLETED' : 'CHECKED_IN',
        notes: pick(['Follow-up visit', 'Routine check-up', 'Referred by GP', 'Annual screening', null]),
        createdAt: hoursLater(at, -48),
      },
    });
  }

  const order = await prisma.order.create({
    data: {
      patientId: patient.id,
      doctorId: doctor.id,
      appointmentId: appointment?.id,
      priority,
      orderDate: at,
      createdAt: at,
      items: { create: services.map((s) => ({ serviceId: s.id, createdAt: at })) },
    },
    include: { items: { include: { service: true } } },
  });

  if (diagnosis) {
    await prisma.diagnosis.create({
      data: { patientId: patient.id, doctorId: doctor.id, orderId: order.id, icd10Code: diagnosis[0], description: diagnosis[1], diagnosedAt: at, createdAt: at },
    });
  }

  await logHl7('ORM^O01', (controlId) => hl7.buildOrmO01({ order, patient, items: order.items, doctor, controlId, at }), { at, orderId: order.id, patientId: patient.id });

  let allDone = true;
  let lastDone = at;

  for (const item of order.items) {
    const isLab = item.service.type === 'LAB';
    const tat = isLab ? between(1, 6) : between(2, 26);
    const doneAt = pastOnly(hoursLater(at, tat));

    if (isLab) {
      if (stage === 'ordered' || (stage !== 'completed' && chance(0.5))) {
        const started = stage !== 'ordered' && chance(0.6);
        await prisma.orderItem.update({ where: { id: item.id }, data: started ? { status: 'IN_PROGRESS', performedBy: pick(labTechs).id } : {} });
        allDone = false;
        continue;
      }
      const tech = pick(labTechs);
      const results = (LAB_PANELS[item.service.name] ?? []).map((a, idx) => {
        let mode = labMode?.[a.testName] ?? (chance(0.03) ? 'critical' : chance(0.2) ? 'abnormal' : 'normal');
        if (typeof mode === 'number') return { testName: a.testName, value: String(mode), unit: a.unit, normalRange: rangeText(a), flag: computeFlag(a, mode), idx };
        const value = labValue(a, mode);
        return { testName: a.testName, value, unit: a.unit, normalRange: rangeText(a), flag: computeFlag(a, value), idx };
      });
      await prisma.labResult.createMany({ data: results.map(({ idx, ...r }) => ({ ...r, itemId: item.id, createdAt: doneAt })) });
      await prisma.orderItem.update({ where: { id: item.id }, data: { status: 'COMPLETED', performedBy: tech.id, completedAt: doneAt } });
      const alerts = labResultRules(item.service.name, results);
      if (alerts.length) await prisma.cdssAlert.createMany({ data: alerts.map((a) => ({ ...a, itemId: item.id, createdAt: doneAt })) });
      await logHl7('ORU^R01', (controlId) => hl7.buildOruR01({ order, patient, item, results, controlId, at: doneAt }), { at: doneAt, orderId: order.id, patientId: patient.id });
      lastDone = doneAt > lastDone ? doneAt : lastDone;
      continue;
    }

    // ── imaging path ──
    if (stage === 'ordered') {
      allDone = false;
      continue;
    }
    const modality = item.service.modality;
    const radiologist = modality === 'MR' ? radiologists[1] : pick(radiologists);
    const acquiredAt = pastOnly(hoursLater(at, between(0.1, 0.4)));
    const studyUid = dicomUid();
    const study = await prisma.imagingStudy.create({
      data: {
        itemId: item.id,
        dicomStudyUid: studyUid,
        imagePath: `orthanc://studies/${studyUid}`,
        performedAt: acquiredAt,
        createdAt: acquiredAt,
        series: {
          create: SERIES_PLAN[modality].map((s) => {
            const seriesUid = dicomUid();
            return { ...s, modality, seriesUid, storagePath: `orthanc://series/${seriesUid}` };
          }),
        },
      },
      include: { series: true },
    });

    const labels = CDSS_LABELS[modality];
    const prediction = cdssPick ?? pick(labels);
    const confidence = Number(between(0.62, 0.97).toFixed(4));
    const rest = labels.filter((l) => l !== prediction);
    const scores = { [prediction]: confidence, ...Object.fromEntries(rest.map((l) => [l, Number(((1 - confidence) / rest.length).toFixed(4))])) };
    const reviewed = stage === 'completed';
    await prisma.cdssResult.create({
      data: {
        studyId: study.id,
        modelName: modality === 'MR' ? 'demo-stub/monai-brain' : 'demo-stub/txrv-densenet121',
        prediction,
        confidence,
        details: { scores, stub: true },
        reviewStatus: reviewed ? (chance(0.85) ? 'ACCEPTED' : 'REJECTED') : 'PENDING',
        reviewedBy: reviewed ? radiologist.id : null,
        createdAt: hoursLater(acquiredAt, 0.05),
      },
    });

    if (chance(0.35) || reportPick !== undefined) {
      await prisma.annotation.create({
        data: {
          seriesId: study.series[0].id,
          instanceUid: dicomUid(),
          staffId: radiologist.id,
          type: modality === 'DX' ? 'ANGLE' : 'LENGTH',
          geometry: modality === 'DX' ? { points: [{ x: 210, y: 140 }, { x: 256, y: 260 }, { x: 300, y: 150 }], value: 172, unit: 'deg' } : { points: [{ x: 180, y: 220 }, { x: 214, y: 236 }], value: Number(between(5, 24).toFixed(1)), unit: 'mm' },
          note: pick(['Measured at the widest diameter', 'Compare with prior study', 'Region of interest', null]),
          createdAt: hoursLater(acquiredAt, 1),
        },
      });
    }

    const [findings, impression] = reportPick !== undefined ? REPORTS[modality][reportPick] : pick(REPORTS[modality]);

    if (stage === 'awaiting_report' || stage === 'in_progress') {
      await prisma.orderItem.update({ where: { id: item.id }, data: { status: 'IN_PROGRESS', performedBy: radiologist.id } });
      allDone = false;
      continue;
    }
    if (stage === 'draft_report') {
      await prisma.radiologyReport.create({ data: { studyId: study.id, radiologistId: radiologist.id, findings, impression, status: 'DRAFT', createdAt: doneAt } });
      await prisma.orderItem.update({ where: { id: item.id }, data: { status: 'IN_PROGRESS', performedBy: radiologist.id } });
      allDone = false;
      continue;
    }

    const report = await prisma.radiologyReport.create({
      data: { studyId: study.id, radiologistId: radiologist.id, findings, impression, status: 'FINAL', signedAt: doneAt, createdAt: doneAt },
    });
    await prisma.orderItem.update({ where: { id: item.id }, data: { status: 'COMPLETED', performedBy: radiologist.id, completedAt: doneAt } });
    await logHl7('ORU^R01', (controlId) => hl7.buildOruR01({ order, patient, item, report, controlId, at: doneAt }), { at: doneAt, orderId: order.id, patientId: patient.id });
    lastDone = doneAt > lastDone ? doneAt : lastDone;
  }

  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  const status = allDone ? 'COMPLETED' : items.some((i) => i.status !== 'ORDERED') ? 'IN_PROGRESS' : 'ORDERED';
  await prisma.order.update({ where: { id: order.id }, data: { status } });

  if (status === 'COMPLETED') {
    const total = order.items.reduce((s, i) => s.add(i.service.price), new Prisma.Decimal(0));
    const invoice = await prisma.invoice.create({
      data: {
        patientId: patient.id,
        orderId: order.id,
        total,
        createdAt: lastDone,
        items: { create: order.items.map((i) => ({ orderItemId: i.id, price: i.service.price, icd10Code: diagnosis?.[0] ?? null })) },
      },
    });
    const roll = rand();
    let paid = new Prisma.Decimal(0);
    if (roll < 0.62) {
      await prisma.payment.create({ data: { invoiceId: invoice.id, amount: total, method: pick(['CASH', 'CARD', 'CARD', 'INSURANCE']), paidAt: pastOnly(hoursLater(lastDone, between(0.2, 30))) } });
      paid = total;
    } else if (roll < 0.82) {
      const part = total.mul(pick([0.3, 0.5])).toDecimalPlaces(2);
      await prisma.payment.create({ data: { invoiceId: invoice.id, amount: part, method: pick(['CASH', 'CARD']), paidAt: pastOnly(hoursLater(lastDone, between(0.2, 10))) } });
      paid = part;
    }
    await prisma.invoice.update({ where: { id: invoice.id }, data: { paymentStatus: paymentStatusFor(total, paid) } });
  }

  await prisma.auditLog.create({ data: { userId: ctx.accountOf.get(doctor.id), action: 'CREATE', tableName: 'orders', recordId: order.id, loggedAt: at } });
  return order;
}

async function main() {
  console.log('Wiping tables…');
  await wipe();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log('Services, staff and accounts…');
  const services = [];
  for (const s of SERVICES) services.push(await prisma.service.create({ data: s }));
  const byName = Object.fromEntries(services.map((s) => [s.name, s]));
  const labServices = services.filter((s) => s.type === 'LAB');
  const radServices = services.filter((s) => s.type === 'RADIOLOGY');

  const staff = [];
  const accountOf = new Map();
  for (const s of STAFF) {
    const created = await prisma.staff.create({
      data: { fullName: s.fullName, role: s.role, specialty: s.specialty, phone: `+2010${String(Math.floor(between(10000000, 99999999)))}` },
    });
    const account = await prisma.userAccount.create({ data: { username: s.username, passwordHash, role: s.role, staffId: created.id } });
    accountOf.set(created.id, account.id);
    staff.push(created);
  }
  const doctors = staff.filter((s) => s.role === 'DOCTOR');
  const labTechs = staff.filter((s) => s.role === 'LAB_TECH');
  const radiologists = staff.filter((s) => s.role === 'RADIOLOGIST');

  console.log('Patients…');
  const patients = [];
  for (const [i, [fullName, gender]] of PATIENT_NAMES.entries()) {
    const birthDate = new Date(Math.floor(between(1952, 2004)), Math.floor(between(0, 12)), Math.floor(between(1, 28)));
    const registeredAt = daysAgo(Math.floor(between(22, 60)), 10);
    const patient = await prisma.patient.create({
      data: {
        fullName,
        gender,
        birthDate,
        nationalId: nationalId(birthDate, gender, i),
        phone: `+201${pick(['0', '1', '2', '5'])}${String(Math.floor(between(10000000, 99999999)))}`,
        email: `${fullName.toLowerCase().split(' ').slice(0, 2).join('.')}@example.com`,
        address: `${Math.floor(between(2, 140))} ${pick(STREETS)}`,
        createdAt: registeredAt,
      },
    });
    patients.push(patient);
    await logHl7('ADT^A04', (controlId) => hl7.buildAdtA04({ patient, controlId, at: registeredAt }), { at: registeredAt, patientId: patient.id });
    // The first six patients get portal accounts.
    if (i < 6) {
      await prisma.userAccount.create({
        data: { username: fullName.toLowerCase().split(' ').slice(0, 2).join('.'), passwordHash, role: 'PATIENT', patientId: patient.id },
      });
    }
  }

  const ctx = { labTechs, radiologists, accountOf };
  const [aya] = patients;
  const salma = doctors[0];
  const nour = doctors[2];

  console.log('The demo patient storyline…');
  // 18 days ago: diabetes work-up, high glucose and potassium
  await createOrder(ctx, {
    patient: aya,
    doctor: salma,
    services: [byName['Complete Blood Count (CBC)'], byName['Basic Metabolic Panel']],
    at: daysAgo(18, 9, 30),
    diagnosis: DIAGNOSES[0],
    labMode: { Glucose: 186, Potassium: 5.6, Hemoglobin: 11.2, WBC: 7.4, Platelets: 265, Sodium: 139, Creatinine: 0.9 },
  });
  // 9 days ago: cough and fever → chest X-ray shows pneumonia
  await createOrder(ctx, {
    patient: aya,
    doctor: nour,
    services: [byName['Chest X-ray (PA)'], byName['Complete Blood Count (CBC)']],
    at: daysAgo(9, 11, 0),
    priority: 'URGENT',
    diagnosis: DIAGNOSES[4],
    reportPick: 1,
    cdssPick: 'Pneumonia',
    labMode: { WBC: 15.8, Hemoglobin: 12.6, Platelets: 310 },
  });
  await prisma.prescription.create({
    data: {
      patientId: aya.id,
      doctorId: nour.id,
      issueDate: daysAgo(9, 13),
      notes: 'Community-acquired pneumonia. Review in 7 days; repeat chest X-ray in 6 weeks.',
      createdAt: daysAgo(9, 13),
      items: {
        create: [
          { drugName: 'Amoxicillin/Clavulanate', dose: '1 g', frequency: 'Twice daily', durationDays: 7 },
          { drugName: 'Paracetamol', dose: '500 mg', frequency: 'Every 6 hours as needed', durationDays: 5 },
        ],
      },
    },
  });
  await prisma.prescription.create({
    data: {
      patientId: aya.id,
      doctorId: salma.id,
      issueDate: daysAgo(17, 10),
      notes: 'Start metformin; diet counselling. Repeat HbA1c in 3 months.',
      createdAt: daysAgo(17, 10),
      items: { create: [{ drugName: 'Metformin', dose: '500 mg', frequency: 'Twice daily with meals', durationDays: 90 }] },
    },
  });
  // Today: follow-up labs, still open (shows on the lab worklist)
  await createOrder(ctx, {
    patient: aya,
    doctor: salma,
    services: [byName['HbA1c'], byName['Lipid Panel']],
    at: daysAgo(0, 9, 15),
    stage: 'ordered',
    diagnosis: DIAGNOSES[0],
  });

  console.log('Three weeks of clinic activity…');
  for (let day = 20; day >= 1; day--) {
    const count = Math.floor(between(2, 5));
    for (let n = 0; n < count; n++) {
      const patient = pick(patients.slice(1));
      const useLab = chance(0.62);
      const chosen = useLab
        ? [...new Set([pick(labServices), ...(chance(0.45) ? [pick(labServices)] : [])])]
        : [pick(radServices), ...(chance(0.25) ? [pick(labServices)] : [])];
      const stage = day <= 1 ? pick(['completed', 'draft_report', 'completed']) : 'completed';
      await createOrder(ctx, {
        patient,
        doctor: pick(doctors),
        services: chosen,
        at: daysAgo(day, Math.floor(between(8, 17)), pick([0, 15, 30, 45])),
        priority: chance(0.12) ? 'STAT' : chance(0.2) ? 'URGENT' : 'ROUTINE',
        stage,
        diagnosis: chance(0.55) ? pick(DIAGNOSES) : undefined,
        withAppointment: chance(0.7),
      });
    }
  }

  console.log("Today's open worklists…");
  // A critical potassium already resulted this morning
  await createOrder(ctx, {
    patient: patients[7],
    doctor: doctors[1],
    services: [byName['Basic Metabolic Panel']],
    at: daysAgo(0, 8, 10),
    priority: 'STAT',
    diagnosis: DIAGNOSES[1],
    labMode: { Potassium: 6.8, Sodium: 133, Glucose: 104, Creatinine: 2.1 },
  });
  const openLab = [
    [patients[3], 'Complete Blood Count (CBC)', 'STAT', 'ordered'],
    [patients[10], 'Liver Function Test', 'ROUTINE', 'ordered'],
    [patients[12], 'Thyroid Stimulating Hormone (TSH)', 'URGENT', 'in_progress'],
    [patients[15], 'Lipid Panel', 'ROUTINE', 'ordered'],
  ];
  for (const [patient, name, priority, stage] of openLab) {
    await createOrder(ctx, { patient, doctor: pick(doctors), services: [byName[name]], at: daysAgo(0, Math.floor(between(8, 11)), 20), priority, stage });
  }
  const openRad = [
    [patients[4], 'CT Chest', 'URGENT', 'ordered'],
    [patients[9], 'Chest X-ray (PA)', 'STAT', 'awaiting_report'],
    [patients[13], 'MRI Brain', 'ROUTINE', 'awaiting_report'],
    [patients[18], 'Abdominal Ultrasound', 'ROUTINE', 'draft_report'],
  ];
  for (const [patient, name, priority, stage] of openRad) {
    await createOrder(ctx, { patient, doctor: pick(doctors), services: [byName[name]], at: daysAgo(0, Math.floor(between(8, 11)), 40), priority, stage });
  }

  // A duplicate CBC within 24h to show the duplicate-order rule
  const dupPatient = patients[3];
  const dup = await createOrder(ctx, { patient: dupPatient, doctor: doctors[0], services: [byName['Complete Blood Count (CBC)']], at: daysAgo(0, 11, 5), stage: 'ordered', withAppointment: false });
  const prev = await prisma.orderItem.findFirst({ where: { order: { patientId: dupPatient.id }, serviceId: byName['Complete Blood Count (CBC)'].id, orderId: { not: dup.id } }, orderBy: { createdAt: 'desc' } });
  const dupItem = await prisma.orderItem.findFirst({ where: { orderId: dup.id } });
  await prisma.cdssAlert.create({
    data: { itemId: dupItem.id, severity: 'MEDIUM', message: `Possible duplicate: Complete Blood Count (CBC) was already ordered 3h ago (order #${prev.orderId}).` },
  });

  console.log('Upcoming appointments…');
  const upcoming = [
    [aya, salma, 'HbA1c', 3, 10],
    [aya, nour, 'Chest X-ray (PA)', 30, 11],
    [patients[2], doctors[1], 'Lipid Panel', 1, 9],
    [patients[5], doctors[0], 'Complete Blood Count (CBC)', 1, 12],
    [patients[8], doctors[2], 'CT Chest', 2, 14],
    [patients[11], doctors[1], 'Basic Metabolic Panel', 2, 10],
    [patients[14], doctors[0], 'Abdominal Ultrasound', 4, 13],
    [patients[16], doctors[2], 'Chest X-ray (PA)', 5, 9],
    [patients[19], doctors[0], 'MRI Brain', 6, 15],
  ];
  for (const [patient, doctor, service, inDays, hour] of upcoming) {
    const dateTime = daysAgo(-inDays, hour, 0);
    const appointment = await prisma.appointment.create({
      data: { patientId: patient.id, staffId: doctor.id, serviceId: byName[service].id, dateTime, notes: 'Booked via patient portal' },
    });
    await logHl7('SIU^S12', (controlId) => hl7.buildSiuS12({ appointment, patient, service: byName[service], controlId, at: daysAgo(1, 16) }), { at: daysAgo(1, 16), patientId: patient.id });
  }

  console.log('Login history…');
  const accounts = await prisma.userAccount.findMany();
  for (const a of accounts) {
    for (let d = 0; d < 3; d++) {
      await prisma.auditLog.create({ data: { userId: a.id, action: 'LOGIN', tableName: 'user_account', recordId: a.id, loggedAt: daysAgo(d * 3, 8, Math.floor(between(0, 59))) } });
    }
  }

  const counts = await Promise.all(
    ['patient', 'staff', 'userAccount', 'auditLog', 'service', 'appointment', 'order', 'orderItem', 'labResult', 'imagingStudy', 'imagingSeries', 'annotation', 'radiologyReport', 'diagnosis', 'prescription', 'prescriptionItem', 'invoice', 'invoiceItem', 'payment', 'cdssAlert', 'cdssResult', 'hl7Message'].map(async (m) => `${m}=${await prisma[m].count()}`),
  );
  console.log('Done:', counts.join('  '));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
