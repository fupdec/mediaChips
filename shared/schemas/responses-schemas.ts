import { z } from 'zod'

export const MediaIdsResponseSchema = z.object({
  ids: z.array(z.number()).optional(),
}).passthrough()
