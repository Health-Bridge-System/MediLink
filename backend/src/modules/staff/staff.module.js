import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { validate } from '../../common/pipes/zod-validation.pipe.js';
import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';
import { queryStaffDto } from './dto/query-staff.dto.js';

export default defineModule({
  name: 'staff',
  path: '/staff',
  providers: {
    staffService: (c) => new StaffService({ prisma: c.resolve('prisma') }),
  },
  // Any signed-in user may list staff (patients pick a doctor when booking).
  routes: (r, c) => {
    const controller = new StaffController({ staffService: c.resolve('staffService') });
    r.get('/', JwtAuthGuard, validate({ query: queryStaffDto }), controller.findAll);
  },
});
