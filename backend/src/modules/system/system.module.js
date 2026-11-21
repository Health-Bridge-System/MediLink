import { defineModule } from '../../common/utils/define-module.js';
import { SystemController } from './system.controller.js';
import { SystemService } from './system.service.js';

export default defineModule({
  name: 'system',
  path: '/system',
  providers: {
    systemService: (c) => new SystemService({ prisma: c.resolve('prisma') }),
  },
  routes: (r, c) => {
    const controller = new SystemController({ systemService: c.resolve('systemService') });
    r.get('/health', controller.health);
  },
});
