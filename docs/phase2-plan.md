# MediLink — Phase 2 plan

Five members, one branch each. Commits are numbered; the **wave** says when a commit can be made.
Everything in a wave can be done in parallel. Start a wave only after the previous wave is merged into `develop`.

## Team

| Member | Area | Branch | Commits |
|---|---|---|---|
| Mohamed Ashraf | Backend | `feature/backend` | 5 |
| Mohamed Hamdy | Database | `feature/database` | 4 |
| Fady Osama | Frontend | `feature/frontend` | 5 |
| Ekram Ahmad | DICOM viewer | `feature/viewer` | 3 |
| Zeyad Ashraf Ahmad | Imaging & testing | `feature/imaging-testing` | 5 |

## Commit order

### Wave 1

| ID | Member | Commit message | Needs |
|---|---|---|---|
| A01 | Mohamed Ashraf | `chore: add project folder structure and tooling` | — |

### Wave 2

| ID | Member | Commit message | Needs |
|---|---|---|---|
| A02 | Mohamed Ashraf | `feat(core): add DI container, event bus and shared backend layer` | A01 |
| H01 | Mohamed Hamdy | `feat(db): add MySQL Docker setup and Prisma schema for the 22-table ERD` | A01 |
| H02 | Mohamed Hamdy | `feat(db): add initial migration` | H01 |
| F01 | Fady Osama | `chore(frontend): add Vite setup and design system` | A01 |
| F02 | Fady Osama | `feat(frontend): add core libraries, UI kit, charts and app shell` | F01 |
| E01 | Ekram Ahmad | `feat(imaging): add DICOM viewer and test image generator` | A01 |

### Wave 3

| ID | Member | Commit message | Needs |
|---|---|---|---|
| A03 | Mohamed Ashraf | `feat(api): add auth, patients, staff, services, audit and health modules` | A02 |
| A04 | Mohamed Ashraf | `feat(api): add appointments, orders, lab results, diagnoses and prescriptions` | A03 |
| A05 | Mohamed Ashraf | `feat(api): add billing and HL7 messaging` | A02 |
| H03 | Mohamed Hamdy | `feat(reports): add dashboard statistics queries` | A02 |
| Z01 | Zeyad Ashraf Ahmad | `feat(imaging): add imaging studies, series, annotations and reports` | A02 |
| Z02 | Zeyad Ashraf Ahmad | `feat(cdss): add rule-based alerts and imaging analysis client` | A02 |
| F03 | Fady Osama | `feat(frontend): add sign-in, dashboards and patient pages` | F02 + A03 + H03 |
| F04 | Fady Osama | `feat(frontend): add appointments, worklists, billing, CDSS, HL7 and audit pages` | F03 + A04 + A05 + Z02 |
| E02 | Ekram Ahmad | `feat(viewer): add AI suggestion and report panels` | E01 + F02 |

### Wave 4

| ID | Member | Commit message | Needs |
|---|---|---|---|
| H04 | Mohamed Hamdy | `feat(db): add demo seed data and schema export` | H02 + A03 + A05 + Z01 + Z02 |
| E03 | Ekram Ahmad | `feat(viewer): add study page` | E02 + Z01 |
| Z03 | Zeyad Ashraf Ahmad | `test(core): add container and event bus unit tests` | A02 |
| Z04 | Zeyad Ashraf Ahmad | `test(api): add authentication and access-control tests` | Z03 + H04 |
| Z05 | Zeyad Ashraf Ahmad | `test(api): add lab and imaging workflow tests` | Z04 |

### Wave 5

| ID | Member | Commit message | Needs |
|---|---|---|---|
| F05 | Fady Osama | `feat(frontend): add routes and app entry` | F04 + E03 |

## Git workflow

1. Mohamed Ashraf pushes **A01** (folder structure) to `main`, then creates `develop` from it.
2. Everyone: `git checkout develop && git pull`, then `git checkout -b <your branch>`.
3. Make your commits for the current wave, in order (one folder = one commit).
4. Push your branch and open a Pull Request into `develop`. Another member reviews it.
5. When all PRs of a wave are merged, everyone runs `git checkout <your branch> && git merge develop` and starts the next wave.
6. At the end, `develop` is merged into `main`.

Rules (from the Phase 0 setup): no direct pushes to `main` or `develop`, one review per PR,
commit types `feat:` `fix:` `docs:` `refactor:` `chore:` `test:`.

## Why modules don't conflict

Backend modules never import each other. They share only `core/events.js` (event names)
and the DI container, and `app.module.js` finds every module folder automatically.
So each person adds new folders and never edits someone else's files.
