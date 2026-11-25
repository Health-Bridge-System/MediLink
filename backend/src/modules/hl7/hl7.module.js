import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { EVENTS } from '../../core/events.js';
import { Hl7Controller } from './hl7.controller.js';
import { Hl7Service } from './hl7.service.js';
import { queryHl7Dto } from './dto/query-hl7.dto.js';

export default defineModule({
  name: 'hl7',
  path: '/hl7',
  providers: {
    hl7Service: (c) => new Hl7Service({ prisma: c.resolve('prisma') }),
  },
  // HL7 reacts to clinical events; no other module calls it directly.
  listeners: (events, c) => {
    const hl7 = c.resolve('hl7Service');
    events.on(EVENTS.PATIENT_REGISTERED, 'hl7.adt', (p) => hl7.patientRegistered(p));
    events.on(EVENTS.APPOINTMENT_BOOKED, 'hl7.siu', (p) => hl7.appointmentBooked(p));
    events.on(EVENTS.ORDER_PLACED, 'hl7.orm', (p) => hl7.orderPlaced(p));
    events.on(EVENTS.LAB_RESULTS_RECORDED, 'hl7.oru-lab', (p) => hl7.resultsReady(p));
    events.on(EVENTS.REPORT_SIGNED, 'hl7.oru-report', (p) => hl7.resultsReady(p));
  },
  routes: (r, c) => {
    const controller = new Hl7Controller({ hl7Service: c.resolve('hl7Service') });
    r.use(JwtAuthGuard, Roles('ADMIN', 'DOCTOR'));
    r.get('/messages', validate({ query: queryHl7Dto }), controller.findAll);
    r.get('/messages/:id', validate({ params: idParam }), controller.findOne);
  },
});
