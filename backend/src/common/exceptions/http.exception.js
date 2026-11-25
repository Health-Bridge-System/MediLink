export class HttpException extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export class BadRequestException extends HttpException {
  constructor(message = 'Bad request', details) {
    super(400, message, details);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message = 'Authentication required') {
    super(401, message);
  }
}

export class ForbiddenException extends HttpException {
  constructor(message = 'You do not have permission to do this') {
    super(403, message);
  }
}

export class NotFoundException extends HttpException {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

export class ConflictException extends HttpException {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}
