import { audit } from '../../common/utils/audit.js';

export class DiagnosesController {
  constructor({ diagnosesService, events }) {
    this.diagnosesService = diagnosesService;
    this.events = events;
  }

  create = async (req, res) => {
    const diagnosis = await this.diagnosesService.create(req.user, req.validated.body);
    audit(this.events, req, 'CREATE', 'diagnosis', diagnosis.id);
    res.status(201).json(diagnosis);
  };
}
