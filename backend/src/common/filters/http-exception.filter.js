import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpException } from '../exceptions/http.exception.js';

// Central error middleware: every thrown error ends up here and is turned
// into one consistent JSON shape: { statusCode, message, details? }.
export function httpExceptionFilter(err, req, res, _next) {
  if (err instanceof HttpException) {
    return res.status(err.status).json({ statusCode: err.status, message: err.message, details: err.details });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ statusCode: 400, message: 'Validation failed', details: formatZodIssues(err) });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const fields = [].concat(err.meta?.target ?? []).join(', ');
      return res.status(409).json({ statusCode: 409, message: `A record with this ${fields || 'value'} already exists` });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ statusCode: 404, message: 'Record not found' });
    }
    if (err.code === 'P2003') {
      return res.status(400).json({ statusCode: 400, message: 'A referenced record does not exist' });
    }
  }

  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ statusCode: 400, message: 'Malformed JSON body' });
  }

  console.error(err);
  return res.status(500).json({ statusCode: 500, message: 'Internal server error' });
}

export function formatZodIssues(error) {
  return error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
}
