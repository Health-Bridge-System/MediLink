import { EVENTS } from '../../core/events.js';

// Controllers record who did what by publishing an event; the audit module
// stores it. Fire-and-forget, so auditing never slows a request down.
export function audit(events, req, action, tableName, recordId = null) {
  events.emit(EVENTS.AUDIT, { userId: req.user?.id ?? null, action, tableName, recordId });
}
