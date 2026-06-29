import { z } from 'zod'

export const coercedBooleanSchema = z.union([
  z.boolean(),
  z.number(),
  z.null(),
  z.enum(['0', '1', 'true', 'false', 'TRUE', 'FALSE']),
]).transform((value) => (
  value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE'
))

export const optionalCoercedBooleanSchema = coercedBooleanSchema.optional()

export const MediaTypeSchema = z.object({
  id: z.number(),
  type: z.string().optional(),
  name: z.string().optional(),
  nameSingular: z.string().optional(),
  icon: z.string().optional(),
  extensions: z.string().optional(),
  hidden: z.boolean().optional(),
  custom: z.boolean().optional(),
  order: z.number().optional(),
})

export const TagSchema = z.object({
  id: z.number(),
  metaId: z.number().optional(),
  name: z.string().optional(),
  synonyms: z.string().optional(),
  favorite: z.boolean().optional(),
  color: z.string().optional(),
  bookmark: z.string().optional(),
}).passthrough()

export const MetaSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  parser: z.boolean().optional(),
  icon: z.string().optional(),
  chipVariant: z.string().optional(),
  color: z.boolean().optional(),
  rating: z.boolean().optional(),
  favorite: z.boolean().optional(),
  synonyms: z.boolean().optional(),
  imageAspectRatio: z.number().optional(),
  hidden: z.boolean().optional(),
  order: z.number().optional(),
  type: z.string().optional(),
}).passthrough()

export const TabSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  url: z.string().optional(),
  name: z.string().optional(),
}).passthrough()

export const PlaylistSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
}).passthrough()

export const SettingEntrySchema = z.object({
  option: z.string(),
  value: z.string(),
})

export const FilterObjectSchema = z.object({
  id: z.number().nullable(),
  param: z.union([z.string(), z.number()]).nullable(),
  type: z.string().nullable(),
  cond: z.string().nullable(),
  val: z.unknown().default(null),
  note: z.string().nullable(),
  active: coercedBooleanSchema,
  lock: coercedBooleanSchema,
  removed: coercedBooleanSchema.optional(),
  metaId: z.number().nullable().optional(),
})

export const MediaItemSchema = z.object({
  id: z.number(),
  name: z.string().optional(),
  path: z.string().optional(),
  mediaTypeId: z.number().optional(),
  thumb: z.string().optional(),
  views: z.number().optional(),
  favorite: z.boolean().optional(),
  duration: z.number().optional(),
  time: z.number().optional(),
}).passthrough()

export const MediaListResponseSchema = z.object({
  items: z.array(MediaItemSchema).optional(),
  totalFiltered: z.number().optional(),
  totalFilesize: z.number().optional(),
  total: z.number().optional(),
  pages: z.number().optional(),
  page: z.number().optional(),
  navigation: z.array(MediaItemSchema).optional(),
})

export type ParsedMediaType = z.infer<typeof MediaTypeSchema>
export type ParsedTag = z.infer<typeof TagSchema>
export type ParsedMeta = z.infer<typeof MetaSchema>
