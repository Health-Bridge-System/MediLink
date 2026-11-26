# MediLink release readiness — independently verified vs not verified

**Status: Engineering QA integration only. NOT authorized for live patient care or commercial deployment.** This is not a regulatory/compliance certification.

## Actual changes in V5

- Corrected appointment POST payload (`staffId`, `notes`, `serviceId`, `dateTime`) and display mapping (`staff.fullName`).
- Appointment lifecycle: role-gated status changes, cancellation without deletion, rescheduling endpoint with collision checks, and explicit state-transition restrictions. Backend time-slot collision prevention is not race-proof; needs database enforcement.
- Real service creation and name/price editing for administrator accounts through existing endpoints. No service deactivation or effective-dated price history yet.
- Real diagnostic order cancellation (not hard-delete) from authorized DOCTOR/ADMIN roles.
- Real invoice detail, payment ledger, balance calculation and recording of *externally confirmed* payments through existing backend payment API. Payment calculation moved into a serializable transaction. No idempotency key or actual payment gateway.
- Fixed admin audit table column mappings (`tableName`, `recordId`, `loggedAt`, `user.username`). Audit event delivery is still not durable.
- Patient demographics editing via existing PATCH endpoint, restricted to ADMIN, RECEPTIONIST and PATIENT (the latter is own-profile only). Improved readable patient history.
- Doctor-only clinical diagnoses and prescriptions entry via existing endpoints. The UI does not clinically validate medication safety.
- Existing token validation now checks live user activation and role, so role changes/deactivation invalidate a stale JWT.
- Built-in workflow guide and responsive interface refinements.

## Not completed — BLOCKERS before launch

1. **Security and compliance:** independent penetration test; MFA; account provisioning, reset/revocation policy, audit access, secret rotation, HTTPS/TLS and reverse proxy, access logs/monitoring, session management, backup encryption and key management, privacy controls, data retention/deletion, consent, data protection impact assessment, and applicable local health/medical laws.
2. **Audit:** transactional/immutable audit trail and tamper monitoring. Existing audit writes are fire-and-forget, errors are swallowed.
3. **Appointment race conditions:** database-enforced conflict prevention, facility timezone/operating hours/holidays, doctor schedules, leave, resource availability, reschedule limits, notification delivery.
4. **Financial integrity:** idempotent payment posting with reference/idempotency keys; currency/tax configuration; reconciliation, refunds/voids, receipts, insurance eligibility and claims, and audited payment reversal. Service prices must be snapshotted at order time, not only invoice time.
5. **Clinical safety:** order verification, specimen collection/labeling/barcoding, accession numbers, lab device interfaces, reference-range versioning, QC and second-person release, critical-value escalation and documented acknowledgment; correction/amendment of results with immutable history.
6. **Patient identity:** duplicate/merge policies, national ID validation, record corrections, consent, contact verification, patient portal enrollment.
7. **Staff and accounts:** admin provisioning/deprovisioning, individual credentials, role review, credential lifecycle and password reset, permissions review, clinical competency checks.
8. **External systems:** verified HL7 v2 transport with retry/dead-letter queue, delivery receipts and inbound validation; reliable EMR/PACS/LIS interoperability. ACK in internal logs alone is not proof of remote delivery.
9. **Reliability:** automated CI integration and E2E tests with a real disposable MySQL instance, performance/scale tests, high availability, backups and tested restore, DR playbook and monitoring/alerting.
10. **Documentation and UX:** accessibility evaluation, real localization and timezone support, professional user documentation, secure export/print controls, error recovery, validation across browsers and device sizes.
11. **DICOM/AI out of scope:** real DICOM viewer/ingestion and medically validated imaging AI-CDSS are deliberately untouched and cannot be advertised as live features.
12. **Release governance:** change control, versioning, deployment pipeline, UAT sign-off, incident response, clinical governance sign-off, jurisdiction-specific licensing/medical-device determination.

## Verification in this package

- 29 standalone Node unit/policy tests passed in the isolated development runtime.
- Frontend `.jsx` files parsed with TypeScript JSX checking; backend `.js` files passed Node syntax checks.
- **Could not run the Windows-specific Vite bundle in the Linux sandbox** because the uploaded `node_modules` contains Windows-native Rolldown bindings. Run `npm run build` on your own Windows computer.
- Could not run browser end-to-end or Prisma/MySQL tests against the user's local database from the sandbox. Run the listed Windows tests and inspect role-based behavior.
- No network push, git branch mutation, or changes to the user's running PC were made. This is a local source package.
