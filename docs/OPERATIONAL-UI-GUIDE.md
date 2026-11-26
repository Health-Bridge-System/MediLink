# MediLink — database-backed operational UI (excluding DICOM pixel rendering and AI CDSS)

This is a **real API-connected implementation increment**, not a demo/test launcher. It does **not** generate fake patient data, diagnostic values, images, or AI findings. It uses the application's Express API and Prisma/MySQL for all visible records. Never use it for clinical care before a professional safety and security assessment.

## Scope implemented by this patch

- Login via `POST /api/auth/login`, then identity via `GET /api/auth/me`. No demo-login calls or hard-coded accounts.
- Role-filtered navigation and backend authorization error handling; token only in volatile React memory (reload = sign out).
- API-backed dashboard, patient directory/registration/history, appointments, service catalog, diagnostic orders, lab worklist and result entry, signed-report workflows, invoices, operational reports, HL7 message log and rule-based clinical alerts.
- Fail-closed behavior for inaccessible routes. No fake responses if server fails.
- Omitted from live UI by design: simulated imaging pixels and simulated AI inference. The underlying module files are preserved, untouched.
- Backend `scripts/bootstrap-admin.mjs` for **empty non-demo databases**, with password hashing and account-existence guard.

## Important limitations requiring verification against the CURRENT integrated backend

The complete backend source was not supplied alongside this patch, so the exact request schemas and response envelopes for appointments, audit, and some listing endpoints could not be verified here. Test each write operation against a disposable test DB and fix mismatches using the real Zod DTOs under `backend/src/modules/*/dto/`. UI role filters are convenience only; API-side permissions are authoritative.

Current backend code also uses a demo-mode mechanism, a deterministic AI-CDSS stub when `CDSS_URL` is empty, and `orthanc://` placeholders without actual DICOM upload. These remain outside scope. **Do not treat this project as clinically production-ready.**

## Install without overwriting team work

1. Do not extract onto the shared `develop` or `main`. Work on `test/local-integration` or a new local branch.
2. Make a safety copy of `frontend/src/main.jsx` if it already contains the earlier local-test launcher.
3. Extract this ZIP at repository root. It replaces `frontend/src/main.jsx` with the actual application entry and adds `frontend/src/App.jsx`, `frontend/src/styles/complete.css`, `frontend/src/lib/api.js`, `frontend/src/lib/data.mjs`, and accompanying tests; the existing imaging viewer and `StudyPage.jsx` are untouched.
4. Backend: keep Docker MySQL running and apply migrations. Use an isolated operational database; do **not** reuse real patient data for development.
5. In `backend/.env`, set `DEMO_MODE=false`, use a unique strong `JWT_SECRET`, and supply appropriate local database connection settings. Keep `.env` uncommitted. Restart backend after changing it.
6. On a brand-new empty database only, create a first admin account using `backend/scripts/bootstrap-admin.mjs` with `MEDILINK_BOOTSTRAP_USERNAME` and `MEDILINK_BOOTSTRAP_PASSWORD`. Do NOT run if any user already exists.
7. Start API in one CMD: `cd backend && node --env-file=.env src/main.js`.
8. Start frontend in another CMD: `cd frontend && npm run dev` (or your known direct `node ...npm-cli.js run dev` workaround).
9. Open `http://localhost:5173/` and sign in with a real account. The frontend proxies `/api` to backend port 4000 through existing Vite config.
10. Run frontend utility tests: `node --test frontend/test/data.test.mjs` from repository root. Run backend integration suite with disposable, seeded QA DB separately.

## Security and completion checklist BEFORE any real patient usage

- Turn off `DEMO_MODE`, ensure zero synthetic QA patients in operational DB; never commit temporary `medilink_local_seed.mjs` or `.env`.
- Enforce roles and record-level ownership in backend; frontend navigation is **not** sufficient protection. Audit every write and sensitive read.
- Review password-reset, account provisioning, session revocation, brute-force rate limiting, input validation, CSRF strategy, CORS and TLS configuration; consider secure HttpOnly cookies rather than volatile bearer token for real deployment.
- Add server-side pagination, server-side search, data retention rules, backups, monitoring, privacy controls and access logs.
- Verify appointment CRUD schemas/status transitions; payment entry/settlement and HL7 ACK through a real external receiving system; this increment currently gives read-only billing and HL7 records.
- Correct the backend security findings reported by npm audit without blindly running `npm audit fix --force`.
- Do not enable real imaging diagnosis until an appropriate DICOM viewer + AI CDSS are integrated and validated.

## Validation runbook

- Build: `cd frontend && npm run build` (requires existing dependencies).
- Unit: `node --test frontend/test/data.test.mjs`.
- API: `/api/system/health` should be HTTP 200; `/api/auth/login` must accept username/password and wrong credentials must fail.
- Create a **test** patient via the UI and verify the matching MySQL record; place a test order and check worklist; enter a clinical **synthetic** test value and verify alert/billing/HL7 behavior; verify role restrictions; test signed report immutability.
- Never conduct these checks against live patient data.
