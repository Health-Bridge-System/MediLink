import { audit } from '../../common/utils/audit.js';

export class ServicesController {
  constructor({ servicesService, events }) {
    this.servicesService = servicesService;
    this.events = events;
  }

  findAll = async (req, res) => {
    res.json(await this.servicesService.findAll(req.validated.query));
  };

  create = async (req, res) => {
    const service = await this.servicesService.create(req.validated.body);
    audit(this.events, req, 'CREATE', 'service', service.id);
    res.status(201).json(service);
  };

  update = async (req, res) => {
    const { id } = req.validated.params;
    const service = await this.servicesService.update(id, req.validated.body);
    audit(this.events, req, 'UPDATE', 'service', id);
    res.json(service);
  };
}
