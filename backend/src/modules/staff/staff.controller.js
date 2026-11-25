export class StaffController {
  constructor({ staffService }) {
    this.staffService = staffService;
  }

  findAll = async (req, res) => {
    res.json(await this.staffService.findAll(req.validated.query));
  };
}
