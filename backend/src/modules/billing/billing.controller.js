import { audit } from '../../common/utils/audit.js';

export class BillingController {
  constructor({ billingService, events }) {
    this.billingService = billingService;
    this.events = events;
  }

  findAll = async (req, res) => {
    res.json(await this.billingService.findAll(req.validated.query));
  };

  findOne = async (req, res) => {
    res.json(await this.billingService.findOne(req.validated.params.id));
  };

  pay = async (req, res) => {
    const { id } = req.validated.params;
    const invoice = await this.billingService.pay(id, req.validated.body);
    audit(this.events, req, 'CREATE', 'payment', id);
    res.status(201).json(invoice);
  };
}
