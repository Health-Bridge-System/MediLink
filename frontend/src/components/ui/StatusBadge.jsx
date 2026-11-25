import Badge from './Badge.jsx';
import { humanize } from '../../lib/format.js';

// One place that decides the colour of every enum value in the ERD.
const TONES = {
  // order / item status
  ORDERED: 'info',
  IN_PROGRESS: 'warn',
  COMPLETED: 'lab',
  CANCELLED: 'muted',
  // appointments
  SCHEDULED: 'info',
  CHECKED_IN: 'primary',
  NO_SHOW: 'danger',
  // priority
  ROUTINE: 'muted',
  URGENT: 'warn',
  STAT: 'danger',
  // lab flags
  NORMAL: 'lab',
  HIGH: 'warn',
  LOW: 'warn',
  CRITICAL: 'danger',
  // billing
  UNPAID: 'danger',
  PARTIAL: 'warn',
  PAID: 'lab',
  // reports & reviews
  DRAFT: 'warn',
  FINAL: 'lab',
  PENDING: 'warn',
  ACCEPTED: 'lab',
  REJECTED: 'muted',
  // alerts
  MEDIUM: 'warn',
  // service types
  LAB: 'lab',
  RADIOLOGY: 'imaging',
  // hl7
  ACKED: 'lab',
  SENT: 'info',
  QUEUED: 'warn',
  FAILED: 'danger',
  OUTBOUND: 'primary',
  INBOUND: 'imaging',
};

const LABELS = { STAT: 'STAT', LAB: 'Lab', RADIOLOGY: 'Imaging', ACKED: 'ACK · AA' };

export default function StatusBadge({ value, dot = true }) {
  if (!value) return null;
  return (
    <Badge tone={TONES[value] ?? 'muted'} dot={dot}>
      {LABELS[value] ?? humanize(value)}
    </Badge>
  );
}
