import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { ResultsController } from './results.controller.js';
import { ResultsService } from './results.service.js';
import { createLabResultsDto } from './dto/lab-result.dto.js';

export default defineModule({
  name: 'results',
  path: '/results',
  providers: {
    resultsService: (c) => new ResultsService({ prisma: c.resolve('prisma'), events: c.resolve('events') }),
  },
  routes: (r, c) => {
    const controller = new ResultsController({ resultsService: c.resolve('resultsService'), events: c.resolve('events') });
    r.post('/items/:id', JwtAuthGuard, Roles('LAB_TECH'), validate({ params: idParam, body: createLabResultsDto }), controller.recordLabResults);
  },
});
