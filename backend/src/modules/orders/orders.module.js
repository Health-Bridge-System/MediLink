import { defineModule } from '../../common/utils/define-module.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CLINICAL_ROLES, Roles } from '../../common/guards/roles.guard.js';
import { idParam, validate } from '../../common/pipes/zod-validation.pipe.js';
import { EVENTS } from '../../core/events.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { createOrderDto, queryOrdersDto, queryWorklistDto } from './dto/order.dto.js';

export default defineModule({
  name: 'orders',
  path: '/orders',
  providers: {
    ordersService: (c) => new OrdersService({ prisma: c.resolve('prisma'), events: c.resolve('events') }),
  },
  // Results and imaging announce finished items; orders recomputes its status.
  listeners: (events, c) => {
    const orders = c.resolve('ordersService');
    events.on(EVENTS.ORDER_ITEM_CHANGED, 'orders.refresh-status', async ({ orderId }) => ({ orderStatus: await orders.refreshStatus(orderId) }));
  },
  routes: (r, c) => {
    const controller = new OrdersController({ ordersService: c.resolve('ordersService'), events: c.resolve('events') });
    r.use(JwtAuthGuard);
    r.get('/', validate({ query: queryOrdersDto }), controller.findAll);
    // Static paths must be registered before "/:id".
    r.get('/worklist', Roles(...CLINICAL_ROLES, 'ADMIN'), validate({ query: queryWorklistDto }), controller.worklist);
    r.patch('/items/:id/start', Roles('LAB_TECH', 'RADIOLOGIST'), validate({ params: idParam }), controller.startItem);
    r.get('/:id', validate({ params: idParam }), controller.findOne);
    r.post('/', Roles('DOCTOR'), validate({ body: createOrderDto }), controller.create);
    r.patch('/:id/cancel', Roles('DOCTOR', 'ADMIN'), validate({ params: idParam }), controller.cancel);
  },
});
