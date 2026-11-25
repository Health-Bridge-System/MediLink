const egp = new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const dateTimeFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' });

export const money = (v) => egp.format(Number(v ?? 0));
export const date = (v) => (v ? dateFmt.format(new Date(v)) : '—');
export const dateTime = (v) => (v ? dateTimeFmt.format(new Date(v)) : '—');
export const time = (v) => (v ? timeFmt.format(new Date(v)) : '—');

export function age(birthDate) {
  if (!birthDate) return '';
  const b = new Date(birthDate);
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) a -= 1;
  return a;
}

export function relative(v) {
  if (!v) return '';
  const diff = (new Date(v).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (abs < 60) return 'just now';
  if (abs < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return rtf.format(Math.round(diff / 86400), 'day');
}

export function initials(name = '') {
  return name
    .replace(/^Dr\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

export const ROLE_LABEL = {
  ADMIN: 'Administrator',
  DOCTOR: 'Doctor',
  LAB_TECH: 'Lab technician',
  RADIOLOGIST: 'Radiologist',
  RECEPTIONIST: 'Receptionist',
  PATIENT: 'Patient',
};

export const humanize = (s = '') => s.toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

export function minutesLabel(min) {
  if (min === null || min === undefined) return '—';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function balanceOf(invoice) {
  const paid = (invoice.payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
  return Math.max(0, Number(invoice.total) - paid);
}

// Local "YYYY-MM-DDTHH:mm" for datetime-local inputs
export function toLocalInput(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
