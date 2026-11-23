import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CLINICAL_ROLES, Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { EVENTS } from '../../core/events.js';
import { CdssController } from './cdss.controller.js';
import { CdssService } from './cdss.service.js';
import { queryAlertsDto, queryResultsDto, reviewResultDto } from './dto/cdss.dto.js';

export default defineModule({
  name: 'cdss',
  path: '/cdss',
  providers: {
    cdssService: (c) => new CdssService({ prisma: c.resolve('prisma'), cdssUrl: c.resolve('config').CDSS_URL }),
  },
  listeners: (events, c) => {
    const cdss = c.resolve('cdssService');
    events.on(EVENTS.ORDER_PLACED, 'cdss.duplicates', (p) => cdss.checkDuplicates(p));
    events.on(EVENTS.LAB_RESULTS_RECORDED, 'cdss.lab-rules', async (p) => ({ alerts: await cdss.alertsForLabResults(p) }));
    events.on(EVENTS.IMAGING_STUDY_STORED, 'cdss.imaging-model', (p) => cdss.analyzeImaging(p));
  },
  routes: (r, c) => {
    const controller = new CdssController({ cdssService: c.resolve('cdssService'), events: c.resolve('events') });
    r.use(JwtAuthGuard, Roles(...CLINICAL_ROLES, 'ADMIN'));
    r.get('/alerts', validate({ query: queryAlertsDto }), controller.findAlerts);
    r.get('/results', validate({ query: queryResultsDto }), controller.findResults);
    r.patch('/results/:id/review', Roles('DOCTOR', 'RADIOLOGIST'), validate({ params: idParam, body: reviewResultDto }), controller.review);
  },
});
