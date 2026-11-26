import jwt from 'jsonwebtoken';
import { config } from '../../config/configuration.js';
import { UnauthorizedException } from '../exceptions/http.exception.js';
import { prisma } from '../../prisma/prisma.service.js';

// Reads "Authorization: Bearer <token>" and puts the decoded user on req.user:
// { id, username, role, staffId, patientId, name }
export async function JwtAuthGuard(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();
  let user;
  try { user = jwt.verify(token, config.JWT_SECRET); }
  catch { throw new UnauthorizedException('Session expired, please sign in again'); }
  // Recheck the account on every request: disabling a user or changing their
  // role immediately revokes an already-issued token rather than waiting 8 h.
  const account = await prisma.userAccount.findUnique({
    where: { id: user.id },
    select: { isActive: true, role: true, staffId: true, patientId: true, username: true },
  });
  if (!account?.isActive || account.role !== user.role || account.username !== user.username ||
      account.staffId !== (user.staffId ?? null) || account.patientId !== (user.patientId ?? null)) {
    throw new UnauthorizedException('Session no longer valid; sign in again');
  }
  req.user = user;
  next();
}

export function signToken(user) {
  return jwt.sign(user, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}
