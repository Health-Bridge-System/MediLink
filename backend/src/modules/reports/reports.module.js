import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles, STAFF_ROLES } from '../../common/guards/roles.guard.js';
import { validate } from '../../common/pipes/zod-validation.pipe.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { dashboardQueryDto } from './dto/report.dto.js';

export default defineModule({
  name: 'reports',
  path: '/reports',
  providers: {
    reportsService: (c) => new ReportsService({ prisma: c.resolve('prisma') }),
  },
  routes: (r, c) => {
    const controller = new ReportsController({ reportsService: c.resolve('reportsService') });
    r.get('/dashboard', JwtAuthGuard, Roles(...STAFF_ROLES), validate({ query: dashboardQueryDto }), controller.dashboard);
  },
});
