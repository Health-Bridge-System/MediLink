# MediLink launch readiness — engineering gates (26 November 2026)

**Current decision: NOT READY FOR REAL PATIENTS OR COMMERCIAL RELEASE.** This checklist is a professional engineering roadmap, not a certification or legal opinion. Project scope intentionally excludes real DICOM processing and AI-based CDSS.

## P0 — Data integrity and clinical workflow (must pass before any live data)

- [ ] Verify exact backend API contracts and appointment relationships. Return doctor/patient/service identifiers and names consistently; eliminate missing doctor data at source.
- [ ] Implement appointment reschedule/cancel/status APIs, audit actor/reason/time, prevent overlapping slots and unauthorized transitions; never rely on frontend-only checks.
- [ ] Complete doctor-created diagnostic orders including multi-service itemization, worklist assignment, cancelled/voided order propagation.
- [ ] Complete lab processing with analyzer or verified manual input, units, reference ranges, delta checks, critical notifications, corrections/amendments and acknowledgement records.
- [ ] Complete service catalog CRUD with effective-dated pricing and soft deactivation; retain historical invoice prices.
- [ ] Complete payments, refunds, itemization, receipts and reconciliation with idempotency and financial audit records. Current UNPAID invoices are not settled merely by UI status.
- [ ] Verify every role's patient access at backend level, not just hidden controls.
- [ ] End-to-end integration tests with concurrency, timezone changes and duplicate submits.

## P0 — Security, operations and governance

- [ ] Replace disposable QA database and passwords; disable DEMO_MODE; prohibit synthetic patient data from production.
- [ ] HTTPS/TLS end-to-end and hardened reverse proxy; secure cookies or justified token approach; short-lived credentials and server revocation/logout.
- [ ] MFA for privileged accounts, account provisioning/deactivation, least privilege, session expiry, password reset, lockout/rate limiting.
- [ ] Server-side object-level authorization and secure direct-object reference checks for every read/write; threat model and penetration test.
- [ ] Encrypted backups, restoration drills, retention policy, disaster recovery objectives and business continuity.
- [ ] Complete immutable audit trail with who/what/when/where and tamper-evidence, access log retention and alerting.
- [ ] Monitoring/structured logs/health alerts, deployed error tracking, incident response runbook, disaster drills.
- [ ] Privacy/legal review for the target country/region; patient data processing and hosting agreements, lawful data access and retention.
- [ ] Separate test/staging/production environments; CI/CD checks, dependency review, reproducible migrations and rollback strategy.

## P1 — Professional UX & accessibility

- [ ] Workflow-aware dashboards for receptionist, doctor, lab tech, radiologist, administrator and patient.
- [ ] Search/filter/sort/pagination with server-side result sets and stable sorting; don't rely on only loaded records.
- [ ] Clear creation/update/deactivation controls where permitted, consistent status badges, actionable empty and error states.
- [ ] Keyboard access, focus management, contrast and screen-reader checks against WCAG 2.2 AA.
- [ ] Responsive patient lists and chart navigation, timezone-display clarity, conflict warnings and printable workflows.
- [ ] User acceptance testing with actual trained healthcare staff on anonymized/synthetic cases, not screenshots alone.

## Interoperability & clinical appropriateness

- [ ] Verify real HL7 exchange against an external receiver; stored ACK flags alone do not prove exchange.
- [ ] Establish supported message versions, code systems, identifiers, retry/dead-letter handling and message validation.
- [ ] Verify integrations with EMR/LIS/RIS/payment hardware as required; don't claim FHIR compatibility without conformance testing.
- [ ] Clinical safety evaluation and hazards analysis for diagnostic, alerting, and report-signing workflows; sign-off by qualified clinicians.
- [ ] Real DICOM processing and AI CDSS remain **out of scope** in the requested release. Explicitly disable and label them unavailable, not simulated as clinical functions.

## Supporting standards to review (not proof of compliance)

- OWASP ASVS v5.0.0: https://owasp.org/projects/asvs
- W3C WCAG 2.2: https://www.w3.org/TR/WCAG22/
- HL7 FHIR Appointment R4: https://www.hl7.org/fhir/R4/appointment.html

A launch sign-off must be backed by test evidence, privacy/security review, incident/backup drills and documented scope/limitations. A passing frontend build and 15 QA tests are **not sufficient**.
