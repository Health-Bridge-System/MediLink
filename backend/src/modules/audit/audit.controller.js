export class AuditController {
  constructor({ auditService }) {
    this.auditService = auditService;
  }

  findAll = async (req, res) => {
    res.json(await this.auditService.findAll(req.validated.query));
  };
}
