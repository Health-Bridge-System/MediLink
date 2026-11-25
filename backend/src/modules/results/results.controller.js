import { audit } from '../../common/utils/audit.js';

export class ResultsController {
  constructor({ resultsService, events }) {
    this.resultsService = resultsService;
    this.events = events;
  }

  recordLabResults = async (req, res) => {
    const { id } = req.validated.params;
    const outcome = await this.resultsService.recordLabResults(req.user, id, req.validated.body);
    audit(this.events, req, 'CREATE', 'lab_result', id);
    res.status(201).json(outcome);
  };
}
