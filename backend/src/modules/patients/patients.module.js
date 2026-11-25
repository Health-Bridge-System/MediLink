import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles, STAFF_ROLES } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { PatientsController } from './patients.controller.js';
import { PatientsService } from './patients.service.js';
import { createPatientDto, queryPatientsDto, updatePatientDto } from './dto/patient.dto.js';

export default defineModule({
  name: 'patients',
  path: '/patients',
  providers: {
    patientsService: (c) => new PatientsService({ prisma: c.resolve('prisma'), events: c.resolve('events') }),
  },
  routes: (r, c) => {
    const controller = new PatientsController({ patientsService: c.resolve('patientsService'), events: c.resolve('events') });
    r.use(JwtAuthGuard);
    r.get('/', Roles(...STAFF_ROLES), validate({ query: queryPatientsDto }), controller.findAll);
    r.post('/', Roles('RECEPTIONIST', 'ADMIN', 'DOCTOR'), validate({ body: createPatientDto }), controller.create);
    // Patients pass the role check here; the service limits them to their own record.
    r.get('/:id', validate({ params: idParam }), controller.findOne);
    r.get('/:id/history', validate({ params: idParam }), controller.history);
    r.patch('/:id', validate({ params: idParam, body: updatePatientDto }), controller.update);
  },
});
