import bcrypt from 'bcryptjs';
import { ForbiddenException, UnauthorizedException } from '../../common/exceptions/http.exception.js';
import { signToken } from '../../common/guards/jwt-auth.guard.js';
import { EVENTS } from '../../core/events.js';

const accountInclude = { staff: true, patient: true };

function toSessionUser(account) {
  return {
    id: account.id,
    username: account.username,
    role: account.role,
    staffId: account.staffId,
    patientId: account.patientId,
    name: account.staff?.fullName ?? account.patient?.fullName ?? account.username,
    specialty: account.staff?.specialty ?? null,
  };
}

export class AuthService {
  constructor({ prisma, events, demoMode }) {
    this.prisma = prisma;
    this.events = events;
    this.demoMode = demoMode;
  }

  async login({ username, password }) {
    const account = await this.prisma.userAccount.findUnique({ where: { username }, include: accountInclude });
    // Same message for unknown user and wrong password, so usernames can't be probed.
    const ok = account && (await bcrypt.compare(password, account.passwordHash));
    if (!ok) throw new UnauthorizedException('Wrong username or password');
    return this.issue(account);
  }

  async demoLogin({ username }) {
    if (!this.demoMode) throw new ForbiddenException('Quick sign-in is disabled');
    const account = await this.prisma.userAccount.findUnique({ where: { username }, include: accountInclude });
    if (!account) throw new UnauthorizedException('Unknown account');
    return this.issue(account);
  }

  async issue(account) {
    if (!account.isActive) throw new ForbiddenException('This account is disabled');
    await this.prisma.userAccount.update({ where: { id: account.id }, data: { lastLogin: new Date() } });
    const user = toSessionUser(account);
    return { token: signToken(user), user };
  }

  async register({ username, password, ...patientData }) {
    const passwordHash = await bcrypt.hash(password, 10);
    const account = await this.prisma.$transaction(async (tx) => {
      const patient = await tx.patient.create({ data: patientData });
      return tx.userAccount.create({ data: { username, passwordHash, role: 'PATIENT', patientId: patient.id }, include: accountInclude });
    });
    await this.events.emit(EVENTS.PATIENT_REGISTERED, { patient: account.patient });
    return this.issue(account);
  }

  async demoAccounts() {
    if (!this.demoMode) return [];
    const accounts = await this.prisma.userAccount.findMany({ where: { isActive: true }, include: accountInclude, orderBy: { id: 'asc' } });
    // One account per role is enough for the quick sign-in panel.
    const seen = new Set();
    return accounts
      .filter((a) => !seen.has(a.role) && seen.add(a.role))
      .map((a) => ({ username: a.username, role: a.role, name: toSessionUser(a).name }));
  }

  async me(userId) {
    const account = await this.prisma.userAccount.findUnique({ where: { id: userId }, include: accountInclude });
    if (!account) throw new UnauthorizedException();
    return toSessionUser(account);
  }
}
