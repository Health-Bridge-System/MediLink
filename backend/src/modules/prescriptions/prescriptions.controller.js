import { audit } from '../../common/utils/audit.js';

export class PrescriptionsController {
  constructor({ prescriptionsService, events }) {
    this.prescriptionsService = prescriptionsService;
    this.events = events;
  }

  create = async (req, res) => {
    const prescription = await this.prescriptionsService.create(req.user, req.validated.body);
    audit(this.events, req, 'CREATE', 'prescription', prescription.id);
    res.status(201).json(prescription);
  };
}
