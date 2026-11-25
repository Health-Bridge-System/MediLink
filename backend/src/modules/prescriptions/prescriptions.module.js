import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { validate } from '../../common/pipes/zod-validation.pipe.js';
import { PrescriptionsController } from './prescriptions.controller.js';
import { PrescriptionsService } from './prescriptions.service.js';
import { createPrescriptionDto } from './dto/prescription.dto.js';

export default defineModule({
  name: 'prescriptions',
  path: '/prescriptions',
  providers: {
    prescriptionsService: (c) => new PrescriptionsService({ prisma: c.resolve('prisma') }),
  },
  routes: (r, c) => {
    const controller = new PrescriptionsController({ prescriptionsService: c.resolve('prescriptionsService'), events: c.resolve('events') });
    r.post('/', JwtAuthGuard, Roles('DOCTOR'), validate({ body: createPrescriptionDto }), controller.create);
  },
});
