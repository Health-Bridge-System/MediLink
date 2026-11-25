import { audit } from '../../common/utils/audit.js';

export class PatientsController {
  constructor({ patientsService, events }) {
    this.patientsService = patientsService;
    this.events = events;
  }

  findAll = async (req, res) => {
    res.json(await this.patientsService.findAll(req.validated.query));
  };

  findOne = async (req, res) => {
    res.json(await this.patientsService.findOne(req.user, req.validated.params.id));
  };

  history = async (req, res) => {
    const { id } = req.validated.params;
    const history = await this.patientsService.history(req.user, id);
    audit(this.events, req, 'VIEW', 'patient', id);
    res.json(history);
  };

  create = async (req, res) => {
    const patient = await this.patientsService.create(req.validated.body);
    audit(this.events, req, 'CREATE', 'patient', patient.id);
    res.status(201).json(patient);
  };

  update = async (req, res) => {
    const { id } = req.validated.params;
    const patient = await this.patientsService.update(req.user, id, req.validated.body);
    audit(this.events, req, 'UPDATE', 'patient', id);
    res.json(patient);
  };
}
