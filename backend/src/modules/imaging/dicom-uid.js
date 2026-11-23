import { randomUUID } from 'node:crypto';

// DICOM UIDs from a UUID, using the standard "2.25." root (ISO/IEC 9834-8).
export function dicomUid() {
  return `2.25.${BigInt(`0x${randomUUID().replace(/-/g, '')}`).toString()}`;
}
