# MediLink UI functional audit — 26 November 2026

Based on the nine user screenshots, Express request log, earlier operational UI package, original project statement and Phase 1 design. These are **course development/QA checks**, not evidence of clinical readiness.

## Verified observations

- Core API health, MySQL and backend (15/15 automated tests) worked in earlier steps.
- Administrator successfully logged in; patient create, directory, services, existing orders, lab worklist, invoices, HL7 message log and reporting API returned data.
- Appointments POST returned HTTP 400: missing numeric `serviceId` and `dateTime`. Frontend sent `scheduledAt`. This patch adds a required service and uses ISO `dateTime`.
- Audit GET `/api/audit/logs` returned 404. This patch uses `/api/audit` as the likely module route. **Run `node tools/inspect-backend-contracts.mjs` and confirm it matches your actual audit.module.js; if not, adjust accordingly.**
- Diagnostic order creation is shown only to `DOCTOR` accounts (doctor-driven workflow); the ADMIN screenshot is read-only by design.
- Lab technicians perform worklist status transitions; ADMIN cannot enter results.
- Both existing invoices were UNPAID; UI was read-only. No payment should be claimed without server-side payment entries.
- HL7 rows show `ACKED` status but this alone does not prove transmission to an external EMR; see whether an actual simulator/receiver is configured.

## Tab-by-tab operating manual and missing functionality

| Page | Intended function (Phase 1) | Current UI / next requirement | Who uses it |
|---|---|---|---|
| Overview | Dashboard KPIs, workload, statistics | Live backend summary; improve period filters and explain metrics | Admin, clinical staff according to role |
| Patients | Register, update profiles; review history, diagnoses, prescriptions | Registration & directory work; patient editing and detailed history UI require further development | Reception, doctor; patients see own records |
| Appointments | Book patient + doctor + service + time; reschedule, cancel, status | Fixed create contract in this patch. **Still missing** status management, rescheduling, cancellation and conflict checks in UI | Reception/admin; patient/doctor views |
| Diagnostic orders | Doctor orders one or more tests, priority, optional diagnosis | Doctor-only create form exists; verify with doctor login. Admin view only; add clear order-item details, edit/cancel where backend supports | Doctor creates; clinical staff view |
| Laboratory worklist | Pending queue for test items, start analysis, enter numeric verified results, finish | Lab technician can start ORDERED items and enter values for IN_PROGRESS items; completed items read-only. Do not manufacture results | Lab tech; admins/doctors read |
| Imaging reports | Study metadata, radiologist draft and final report | Metadata/report operations present. Real DICOM processing excluded by request | Radiologist, doctors, patients (final only) |
| Services | Catalog of orderable tests, type, modality, price, analytes | Read-only listing currently. Add admin-only service CRUD and service validity/pricing constraints against verified DTOs | Admin manages; doctor/reception view |
| Billing | Itemized invoices generated from service orders, payment status and receipts | Invoice list, targeted client-side search and status filter. **Not yet implemented:** payment collection, installments, refunds, receipt history | Admin (patient access in Phase 1 requires UI/backend ownership checks) |
| Rule-based alerts | Non-AI critical lab warnings | Existing thresholds produce alerts. Review context/acknowledgement and clinical sign-off separately | Clinicians |
| Operational reports | Activity, workloads, revenue (role-filtered) | Reports API works; add explicit date filters, breakdowns and exports | Admin and authorized staff |
| HL7 messages | Outbound orders/results, ACK tracking, simulator exchange | Local message log works; confirm actual external receiver and error/retry workflow | Admin/integration staff |
| Audit trail | Actor, action, object, timestamp and result | Route corrected tentatively; verify backend route and add filters, permissions, detail view | Admin |
| Staff | Directory, clinical roles, assignment | Read-only listing; administrator provisioning and status management still incomplete | Admin and reception |

## Manual QA sequence (only fictional or synthetic test records)

1. Keep Docker, MySQL, backend and Vite running on `test/local-integration`.
2. Log in with administrator; in Appointments choose a real patient, a DOCTOR-role staff record, a service and a valid future time. Submit once. Verify HTTP 201/200 and the new database row.
3. Check the patient directory and medical-history view. Check date-only birth dates are not displayed with spurious timezone hours.
4. Sign out. Log in with an authorized DOCTOR account; create a LAB order for a fictional patient, with one service. Verify order is ORDERED and worklist item appears under ORDERED.
5. Log in with authorized LAB_TECH; start test; enter genuine *fictional* test values for QA; verify COMPLETED and alert/invoice generation. Do not run this on real patient data.
6. Log in with ADMIN; search Billing by invoice ID, order ID or `UNPAID`. Verify correct amount and status. **Do not claim it has been paid just because it appears in a table.**
7. Confirm Audit route: inspect backend module; verify GET as admin and denial without ADMIN role.
8. Compare HL7 order/results messages with actual receiver logs if an EMR simulator exists; local ACK status alone is insufficient.
9. Test patient vs clinician visibility and blocked operations. Run `node --env-file=.env --test --test-concurrency=1` from backend (separate QA DB).

## Outstanding implementation (not included in this narrow patch)

- Service administration, appointment status/reschedule/cancel, provider schedule conflicts, payment submission/settlement/receipts, staff/user administration, invoice filtering/pagination on backend, full patient self-service, and diagnosis/prescription UI.
- Confirm any endpoint before implementing mutation: review `backend/src/modules/<name>/<name>.module.js` and DTOs. Do not invent API contracts.
- Real DICOM viewer and AI CDSS intentionally out of scope.
- Before any real clinical use: privacy/security review, credential/role management, secure deployment, audit completeness, backups, retention and interoperability tests.

## Applying this patch

Extract at `D:\his project\MediLink` (on the **test/local-integration** branch only); it replaces `frontend/src/App.jsx`, adds `frontend/src/lib/appointments.mjs`, unit tests and this guide, and adds a read-only API contract inspector. It never touches the database or backend modules. Back up `frontend/src/App.jsx` first. Do **not** push it to `develop` before testing.

From repo root:

```bat
node --test frontend/test/appointments-contract.test.mjs
node tools/inspect-backend-contracts.mjs
```

From frontend:

```bat
node "C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js" run build
```

Inspect the `Audit routes` in the console report and adjust `path="/audit"` if the server uses a different route. Then open `http://localhost:5173` and manually retest appointments, audit, orders, lab, billing and role boundaries.
