import jwt from 'jsonwebtoken';
import { config } from '../../config/configuration.js';
import { UnauthorizedException } from '../exceptions/http.exception.js';

// Reads "Authorization: Bearer <token>" and puts the decoded user on req.user:
// { id, username, role, staffId, patientId, name }
export function JwtAuthGuard(req, _res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();

  try {
    req.user = jwt.verify(token, config.JWT_SECRET);
  } catch {
    throw new UnauthorizedException('Session expired, please sign in again');
  }
  next();
}

export function signToken(user) {
  return jwt.sign(user, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
}
