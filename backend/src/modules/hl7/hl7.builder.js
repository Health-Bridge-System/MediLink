// Builds HL7 v2.5.1 messages as pipe-delimited text.
// Segments are separated by \r as the standard requires.

const pad = (n) => String(n).padStart(2, '0');

export function hl7Timestamp(date = new Date()) {
  return (
    date.getFullYear() +
    pad(date.getMonth() + 1) +
    pad(date.getDate()) +
    pad(date.getHours()) +
    pad(date.getMinutes()) +
    pad(date.getSeconds())
  );
}

export function newControlId() {
  return `ML${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// HL7 reserves | ^ ~ \ & — escape them inside field values.
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/\\/g, '\\E\\')
    .replace(/\|/g, '\\F\\')
    .replace(/\^/g, '\\S\\')
    .replace(/~/g, '\\R\\')
    .replace(/&/g, '\\T\\');
}

function msh(type, controlId, at) {
  return `MSH|^~\\&|MEDILINK|LAB_IMAGING|EMR_SIM|HOSPITAL|${hl7Timestamp(at)}||${type}|${controlId}|P|2.5.1`;
}

function pid(patient) {
  const [first, ...rest] = patient.fullName.split(' ');
  const last = rest.join(' ') || first;
  const dob = hl7Timestamp(new Date(patient.birthDate)).slice(0, 8);
  const sex = patient.gender === 'MALE' ? 'M' : 'F';
  return `PID|1||${patient.id}^^^MEDILINK^MR~${esc(patient.nationalId)}^^^EG^NI||${esc(last)}^${esc(first)}||${dob}|${sex}|||${esc(patient.address)}||${esc(patient.phone)}`;
}

function serviceCode(service) {
  return `${service.type === 'LAB' ? 'LAB' : 'RAD'}${String(service.id).padStart(3, '0')}^${esc(service.name)}^MEDILINK`;
}

const OBX_FLAG = { NORMAL: 'N', HIGH: 'H', LOW: 'L', CRITICAL: 'AA' };

export function buildAdtA04({ patient, controlId, at }) {
  return [msh('ADT^A04^ADT_A01', controlId, at), `EVN|A04|${hl7Timestamp(at)}`, pid(patient), 'PV1|1|O'].join('\r');
}

export function buildSiuS12({ appointment, patient, service, controlId, at }) {
  return [
    msh('SIU^S12^SIU_S12', controlId, at),
    `SCH|${appointment.id}||||||${esc(appointment.notes)}|||||^^^${hl7Timestamp(new Date(appointment.dateTime))}`,
    pid(patient),
    service ? `AIS|1||${serviceCode(service)}|${hl7Timestamp(new Date(appointment.dateTime))}` : 'AIS|1',
  ].join('\r');
}

export function buildOrmO01({ order, patient, items, doctor, controlId, at }) {
  const segments = [msh('ORM^O01^ORM_O01', controlId, at), pid(patient), 'PV1|1|O'];
  items.forEach((item, i) => {
    segments.push(`ORC|NW|${order.id}-${item.id}|||||^^^^^${order.priority === 'STAT' ? 'S' : 'R'}||${hl7Timestamp(at)}|||${doctor.id}^${esc(doctor.fullName)}`);
    segments.push(`OBR|${i + 1}|${order.id}-${item.id}||${serviceCode(item.service)}|||${hl7Timestamp(at)}`);
  });
  return segments.join('\r');
}

// Lab results: one OBX per analyte. Radiology: OBX lines carry the report text.
export function buildOruR01({ order, patient, item, results = [], report, controlId, at }) {
  const segments = [
    msh('ORU^R01^ORU_R01', controlId, at),
    pid(patient),
    `OBR|1|${order.id}-${item.id}||${serviceCode(item.service)}|||${hl7Timestamp(at)}||||||||||||||||F`,
  ];
  results.forEach((r, i) => {
    const type = Number.isFinite(Number(r.value)) ? 'NM' : 'ST';
    segments.push(`OBX|${i + 1}|${type}|${esc(r.testName)}||${esc(r.value)}|${esc(r.unit)}|${esc(r.normalRange)}|${OBX_FLAG[r.flag] ?? ''}|||F`);
  });
  if (report) {
    segments.push(`OBX|${results.length + 1}|TX|FINDINGS||${esc(report.findings)}||||||F`);
    segments.push(`OBX|${results.length + 2}|TX|IMPRESSION||${esc(report.impression)}||||||F`);
  }
  return segments.join('\r');
}

export function buildAck({ originalControlId, ackCode = 'AA', controlId, at, text = '' }) {
  return [msh('ACK', controlId, at), `MSA|${ackCode}|${originalControlId}|${esc(text)}`].join('\r');
}
