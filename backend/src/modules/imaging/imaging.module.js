import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { ImagingController } from './imaging.controller.js';
import { ImagingService } from './imaging.service.js';
import { createAnnotationDto, createStudyDto, upsertReportDto } from './dto/imaging.dto.js';

export default defineModule({
  name: 'imaging',
  path: '/imaging',
  providers: {
    imagingService: (c) => new ImagingService({ prisma: c.resolve('prisma'), events: c.resolve('events') }),
  },
  routes: (r, c) => {
    const controller = new ImagingController({ imagingService: c.resolve('imagingService'), events: c.resolve('events') });
    r.use(JwtAuthGuard);
    r.get('/studies', Roles('RADIOLOGIST', 'DOCTOR', 'ADMIN'), controller.findAll);
    r.get('/studies/:id', validate({ params: idParam }), controller.findOne);
    r.post('/studies', Roles('RADIOLOGIST'), validate({ body: createStudyDto }), controller.create);
    r.post('/studies/:id/analyze', Roles('RADIOLOGIST', 'DOCTOR'), validate({ params: idParam }), controller.reanalyze);
    r.put('/studies/:id/report', Roles('RADIOLOGIST'), validate({ params: idParam, body: upsertReportDto }), controller.upsertReport);
    r.post('/series/:id/annotations', Roles('RADIOLOGIST', 'DOCTOR'), validate({ params: idParam, body: createAnnotationDto }), controller.addAnnotation);
  },
});
