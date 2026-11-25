import { z } from 'zod';
import { BadRequestException } from '../exceptions/http.exception.js';
import { formatZodIssues } from '../filters/http-exception.filter.js';

// validate({ body, query, params }) — the Express version of a NestJS
// ValidationPipe. Parsed (and coerced) values are stored on req.validated
// so controllers never touch unvalidated input.
export function validate(schemas) {
  return (req, _res, next) => {
    req.validated = req.validated ?? {};
    for (const part of ['params', 'query', 'body']) {
      if (!schemas[part]) continue;
      const result = schemas[part].safeParse(req[part] ?? {});
      if (!result.success) {
        throw new BadRequestException(`Invalid request ${part}`, formatZodIssues(result.error));
      }
      req.validated[part] = result.data;
    }
    next();
  };
}

// Shared building blocks for DTOs
export const idParam = z.object({ id: z.coerce.number().int().positive() });

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
