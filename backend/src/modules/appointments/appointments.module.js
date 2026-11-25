import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { createAppointmentDto, queryAppointmentsDto, updateAppointmentStatusDto } from './dto/appointment.dto.js';

export default defineModule({
  name: 'appointments',
  path: '/appointments',
  providers: {
    appointmentsService: (c) => new AppointmentsService({ prisma: c.resolve('prisma'), events: c.resolve('events') }),
  },
  routes: (r, c) => {
    const controller = new AppointmentsController({ appointmentsService: c.resolve('appointmentsService'), events: c.resolve('events') });
    r.use(JwtAuthGuard);
    r.get('/', validate({ query: queryAppointmentsDto }), controller.findAll);
    r.post('/', Roles('PATIENT', 'RECEPTIONIST', 'ADMIN', 'DOCTOR'), validate({ body: createAppointmentDto }), controller.create);
    r.patch('/:id/status', validate({ params: idParam, body: updateAppointmentStatusDto }), controller.updateStatus);
  },
});
