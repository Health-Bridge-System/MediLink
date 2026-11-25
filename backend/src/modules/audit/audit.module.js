import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { validate } from '../../common/pipes/zod-validation.pipe.js';
import { EVENTS } from '../../core/events.js';
import { AuditController } from './audit.controller.js';
import { AuditService } from './audit.service.js';
import { queryAuditDto } from './dto/query-audit.dto.js';

export default defineModule({
  name: 'audit',
  path: '/audit',
  providers: {
    auditService: (c) => new AuditService({ prisma: c.resolve('prisma') }),
  },
  listeners: (events, c) => {
    const auditService = c.resolve('auditService');
    events.on(EVENTS.AUDIT, 'audit.log', (entry) => auditService.log(entry));
  },
  routes: (r, c) => {
    const controller = new AuditController({ auditService: c.resolve('auditService') });
    r.get('/', JwtAuthGuard, Roles('ADMIN'), validate({ query: queryAuditDto }), controller.findAll);
  },
});
