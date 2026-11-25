import { z } from 'zod';
import { paginationQuery } from '../../../common/pipes/zod-validation.pipe.js';

export const queryHl7Dto = paginationQuery.extend({
  messageType: z.enum(['ADT^A04', 'SIU^S12', 'ORM^O01', 'ORU^R01', 'ACK']).optional(),
  direction: z.enum(['OUTBOUND', 'INBOUND']).optional(),
});
