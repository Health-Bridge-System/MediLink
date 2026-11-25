export class ReportsController {
  constructor({ reportsService }) {
    this.reportsService = reportsService;
  }

  // Revenue figures are billing data, so only administrators receive them.
  dashboard = async (req, res) => {
    res.json(await this.reportsService.dashboard(req.validated.query, { includeFinance: req.user.role === 'ADMIN' }));
  };
}
