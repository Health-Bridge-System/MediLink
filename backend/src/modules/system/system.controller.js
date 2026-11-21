export class SystemController {
  constructor({ systemService }) {
    this.systemService = systemService;
  }

  health = async (_req, res) => {
    res.json(await this.systemService.health());
  };
}
