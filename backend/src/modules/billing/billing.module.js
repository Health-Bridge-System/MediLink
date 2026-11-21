import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { EVENTS } from '../../core/events.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';
import { createPaymentDto, queryInvoicesDto } from './dto/billing.dto.js';

export default defineModule({
  name: 'billing',
  path: '/invoices',
  providers: {
    billingService: (c) => new BillingService({ prisma: c.resolve('prisma') }),
  },
  // An invoice is created when the orders module announces a completed order.
  listeners: (events, c) => {
    const billing = c.resolve('billingService');
    events.on(EVENTS.ORDER_COMPLETED, 'billing.invoice', (p) => billing.createForOrder(p));
  },
  routes: (r, c) => {
    const controller = new BillingController({ billingService: c.resolve('billingService'), events: c.resolve('events') });
    // Billing is visible to administrators only.
    r.use(JwtAuthGuard, Roles('ADMIN'));
    r.get('/', validate({ query: queryInvoicesDto }), controller.findAll);
    r.get('/:id', validate({ params: idParam }), controller.findOne);
    r.post('/:id/payments', validate({ params: idParam, body: createPaymentDto }), controller.pay);
  },
});
