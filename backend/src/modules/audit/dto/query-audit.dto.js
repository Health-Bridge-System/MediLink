import { z } from 'zod';
import { paginationQuery } from '../../../common/pipes/zod-validation.pipe.js';

export const queryAuditDto = paginationQuery.extend({
  tableName: z.string().max(50).optional(),
});
