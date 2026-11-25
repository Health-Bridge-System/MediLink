import { audit } from '../../common/utils/audit.js';

export class AuthController {
  constructor({ authService, events }) {
    this.authService = authService;
    this.events = events;
  }

  login = async (req, res) => {
    const session = await this.authService.login(req.validated.body);
    audit(this.events, { user: session.user }, 'LOGIN', 'user_account', session.user.id);
    res.json(session);
  };

  demoLogin = async (req, res) => {
    const session = await this.authService.demoLogin(req.validated.body);
    audit(this.events, { user: session.user }, 'LOGIN', 'user_account', session.user.id);
    res.json(session);
  };

  register = async (req, res) => {
    const session = await this.authService.register(req.validated.body);
    audit(this.events, { user: session.user }, 'CREATE', 'patient', session.user.patientId);
    res.status(201).json(session);
  };

  demoAccounts = async (_req, res) => {
    res.json(await this.authService.demoAccounts());
  };

  me = async (req, res) => {
    res.json(await this.authService.me(req.user.id));
  };
}
