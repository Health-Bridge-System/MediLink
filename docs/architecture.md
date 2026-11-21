# MediLink architecture (backend)

The backend follows a NestJS-style layout on top of Express, with three rules
that keep modules **loosely coupled**, so each team member can build their part
without editing anyone else's files.

## 1. One folder per feature

```
backend/src/modules/<name>/
  <name>.module.js       wiring: providers, event listeners, routes
  <name>.controller.js   HTTP in/out only (req → service → res)
  <name>.service.js      business rules + database access
  dto/*.dto.js           Zod schemas for request validation
```

`app.module.js` loads every `modules/*/*.module.js` automatically.
**Adding a module never means editing a shared file.**

## 2. Dependency injection (no `new` across modules)

`core/container.js` is a small DI container. Shared infrastructure is
registered once in `app.module.js` (`prisma`, `events`, `config`); each
module registers its own services:

```js
export default defineModule({
  name: 'orders',
  path: '/orders',
  providers: {
    ordersService: (c) => new OrdersService({ prisma: c.resolve('prisma'), events: c.resolve('events') }),
  },
  routes: (r, c) => { /* ... */ },
});
```

Services receive what they need through the constructor, so they can be tested
with fakes and swapped without touching callers.

## 3. Modules talk through events, not imports

A module announces what happened; other modules react. The publisher does not
know who listens. All event names and payloads live in `core/events.js`, the
only contract modules share.

| Event | Published by | Listened to by |
|---|---|---|
| `patient.registered` | auth, patients | hl7 (ADT^A04) |
| `appointment.booked` | appointments | hl7 (SIU^S12) |
| `order.placed` | orders | cdss (duplicate check), hl7 (ORM^O01) |
| `lab.results-recorded` | results | cdss (critical-value rules), hl7 (ORU^R01) |
| `imaging.study-stored` | imaging | cdss (imaging model) |
| `imaging.report-signed` | imaging | hl7 (ORU^R01) |
| `order-item.changed` | results, imaging | orders (recompute status) |
| `order.completed` | orders | billing (create invoice) |
| `audit.record` | every controller | audit (store entry) |

Example: when the last test of an order is done, the flow is
`results → order-item.changed → orders → order.completed → billing`,
and none of these modules imports another.

## SOLID in this codebase

| Principle | Where |
|---|---|
| **S**ingle responsibility | Controller = HTTP, service = rules, DTO = validation, module = wiring |
| **O**pen/closed | New behaviour = new listener or new module; existing modules stay unchanged |
| **L**iskov substitution | Any object with the same methods can replace a service (tests, `Hl7Service.transmit`) |
| **I**nterface segregation | Each service gets only the dependencies it needs (`{ prisma }`, `{ prisma, events }`) |
| **D**ependency inversion | Modules depend on container names and event names, not on each other's classes |

## Shared code (`common/`)

Guards (`JwtAuthGuard`, `Roles`), the Zod `validate()` pipe, the central error
filter, HTTP exceptions, the `audit()` helper and lab reference ranges. These
are infrastructure every module may import; they never import a module.
