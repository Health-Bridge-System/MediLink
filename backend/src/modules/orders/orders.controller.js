import { audit } from '../../common/utils/audit.js';

export class OrdersController {
  constructor({ ordersService, events }) {
    this.ordersService = ordersService;
    this.events = events;
  }

  findAll = async (req, res) => {
    res.json(await this.ordersService.findAll(req.user, req.validated.query));
  };

  worklist = async (req, res) => {
    res.json(await this.ordersService.worklist(req.validated.query));
  };

  findOne = async (req, res) => {
    res.json(await this.ordersService.findOne(req.user, req.validated.params.id));
  };

  create = async (req, res) => {
    const order = await this.ordersService.create(req.user, req.validated.body);
    audit(this.events, req, 'CREATE', 'orders', order.id);
    res.status(201).json(order);
  };

  startItem = async (req, res) => {
    const { id } = req.validated.params;
    const item = await this.ordersService.startItem(req.user, id);
    audit(this.events, req, 'UPDATE', 'order_item', id);
    res.json(item);
  };

  cancel = async (req, res) => {
    const { id } = req.validated.params;
    const order = await this.ordersService.cancel(req.user, id);
    audit(this.events, req, 'UPDATE', 'orders', id);
    res.json(order);
  };
}
