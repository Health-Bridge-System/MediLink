export class Hl7Controller {
  constructor({ hl7Service }) {
    this.hl7Service = hl7Service;
  }

  findAll = async (req, res) => {
    res.json(await this.hl7Service.findAll(req.validated.query));
  };

  findOne = async (req, res) => {
    res.json(await this.hl7Service.findOne(req.validated.params.id));
  };
}
