import { audit } from '../../common/utils/audit.js';

export class ImagingController {
  constructor({ imagingService, events }) {
    this.imagingService = imagingService;
    this.events = events;
  }

  findAll = async (_req, res) => {
    res.json(await this.imagingService.findAll());
  };

  findOne = async (req, res) => {
    res.json(await this.imagingService.findOne(req.user, req.validated.params.id));
  };

  create = async (req, res) => {
    const study = await this.imagingService.create(req.user, req.validated.body);
    audit(this.events, req, 'CREATE', 'imaging_study', study.id);
    res.status(201).json(study);
  };

  reanalyze = async (req, res) => {
    res.json(await this.imagingService.reanalyze(req.user, req.validated.params.id));
  };

  upsertReport = async (req, res) => {
    const { id } = req.validated.params;
    const study = await this.imagingService.upsertReport(req.user, id, req.validated.body);
    audit(this.events, req, 'UPDATE', 'radiology_report', study.report?.id ?? null);
    res.json(study);
  };

  addAnnotation = async (req, res) => {
    const { id } = req.validated.params;
    const annotation = await this.imagingService.addAnnotation(req.user, id, req.validated.body);
    audit(this.events, req, 'CREATE', 'annotation', annotation.id);
    res.status(201).json(annotation);
  };
}
