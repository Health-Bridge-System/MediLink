import { audit } from '../../common/utils/audit.js';

export class AppointmentsController {
  constructor({ appointmentsService, events }) {
    this.appointmentsService = appointmentsService;
    this.events = events;
  }

  findAll = async (req, res) => {
    res.json(await this.appointmentsService.findAll(req.user, req.validated.query));
  };

  create = async (req, res) => {
    const appointment = await this.appointmentsService.create(req.user, req.validated.body);
    audit(this.events, req, 'CREATE', 'appointment', appointment.id);
    res.status(201).json(appointment);
  };

  updateStatus = async (req, res) => {
    const { id } = req.validated.params;
    const appointment = await this.appointmentsService.updateStatus(req.user, id, req.validated.body.status);
    audit(this.events, req, 'UPDATE', 'appointment', id);
    res.json(appointment);
  };
}
