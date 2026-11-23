import { audit } from '../../common/utils/audit.js';

export class CdssController {
  constructor({ cdssService, events }) {
    this.cdssService = cdssService;
    this.events = events;
  }

  findAlerts = async (req, res) => {
    res.json(await this.cdssService.findAlerts(req.validated.query));
  };

  findResults = async (req, res) => {
    res.json(await this.cdssService.findResults(req.validated.query));
  };

  review = async (req, res) => {
    const { id } = req.validated.params;
    const result = await this.cdssService.review(id, req.user.staffId, req.validated.body.reviewStatus);
    audit(this.events, req, 'UPDATE', 'cdss_result', id);
    res.json(result);
  };
}
