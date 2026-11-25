# MediLink — Integrated Laboratory & Imaging System

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, React Router, GSAP, Zod |
| Backend | Node.js + Express 5 (NestJS-style modules, DI container, event bus), Zod, JWT |
| Database | MySQL 8.4 through Prisma 6 (22-table ERD) |
| Imaging | DICOM viewer in `imaging/` |

## Run it

Requirements: Node.js 20+, Docker.

```bash
docker compose up -d                 # MySQL on localhost:3307

cd backend
cp .env.example .env                 # then set a long random JWT_SECRET
npm install
npx prisma migrate deploy            # create the 22 tables
npm run db:seed                      # demo data
npm run dev                          # API on http://localhost:4000/api
npm test                             # API tests (needs the seeded database)

cd ../frontend
npm install
npm run dev                          # web app on http://localhost:5173
```

Demo usernames and the shared test password are listed at the top of
`backend/prisma/seed.js`.

## Project structure

```
MediLink/
├── backend/
│   ├── prisma/            schema.prisma (the ERD), migrations, seed.js
│   ├── src/
│   │   ├── main.js        bootstrap
│   │   ├── app.module.js  composition root: loads every module automatically
│   │   ├── core/          DI container, event bus, event contract
│   │   ├── config/        env validation (Zod)
│   │   ├── prisma/        Prisma client
│   │   ├── common/        guards, Zod pipe, error filter, shared helpers
│   │   └── modules/       one folder per feature (module · controller · service · dto)
│   └── test/              API and unit tests (node:test)
├── frontend/src/
│   ├── pages/             one page per route
│   ├── components/        ui/, layout/, charts/ and feature components
│   ├── hooks/             useApi, GSAP motion hooks
│   └── lib/               API client, auth, Zod schemas, formatting
├── imaging/viewer/        DICOM viewer (imported as @imaging)
├── database/              Docker init SQL, exported schema.sql
├── docs/                  architecture and team plan
└── docker-compose.yml
```

See [docs/architecture.md](docs/architecture.md) for how modules stay
independent (dependency injection + events).

## Backend modules

appointments · audit · auth · billing · cdss · diagnoses · hl7 · imaging · orders ·
patients · prescriptions · reports · results · services · staff · system

## Not connected yet

- **CDSS imaging model:** `CDSS_URL` is empty, so `cdss.client.js` returns placeholder
  predictions (model name `demo-stub/...`). Point `CDSS_URL` at the Python FastAPI service
  (`POST /analyze`) to use the real model.
- **DICOM storage:** the viewer draws generated test images. Real studies need Orthanc
  (DICOMweb) and Cornerstone3D, including MPR and 3D.
- **HL7 transport:** messages are real HL7 v2.5.1 text and logged, but the ACK is
  produced locally. `Hl7Service.transmit` is where an MLLP client to the EMR simulator goes.
