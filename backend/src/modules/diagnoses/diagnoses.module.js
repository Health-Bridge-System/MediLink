import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { validate } from '../../common/pipes/zod-validation.pipe.js';
import { DiagnosesController } from './diagnoses.controller.js';
import { DiagnosesService } from './diagnoses.service.js';
import { createDiagnosisDto } from './dto/diagnosis.dto.js';

export default defineModule({
  name: 'diagnoses',
  path: '/diagnoses',
  providers: {
    diagnosesService: (c) => new DiagnosesService({ prisma: c.resolve('prisma') }),
  },
  routes: (r, c) => {
    const controller = new DiagnosesController({ diagnosesService: c.resolve('diagnosesService'), events: c.resolve('events') });
    r.post('/', JwtAuthGuard, Roles('DOCTOR'), validate({ body: createDiagnosisDto }), controller.create);
  },
});
