import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';
import { createServiceDto, queryServicesDto, updateServiceDto } from './dto/service.dto.js';

export default defineModule({
  name: 'services',
  path: '/services',
  providers: {
    servicesService: (c) => new ServicesService({ prisma: c.resolve('prisma') }),
  },
  routes: (r, c) => {
    const controller = new ServicesController({ servicesService: c.resolve('servicesService'), events: c.resolve('events') });
    r.use(JwtAuthGuard);
    r.get('/', validate({ query: queryServicesDto }), controller.findAll);
    r.post('/', Roles('ADMIN'), validate({ body: createServiceDto }), controller.create);
    r.patch('/:id', Roles('ADMIN'), validate({ params: idParam, body: updateServiceDto }), controller.update);
  },
});
