import { z } from 'zod'
import type { LicenseInfo } from '@/types/stores'

export const LicenseInfoSchema = z.object({
  license_code: z.string().optional(),
  license_created: z.string().optional(),
  license_expiry: z.string().optional(),
  license_type: z.string().optional(),
  client_email: z.string().optional(),
  client_name: z.string().optional(),
  fingerprint_1: z.string().optional(),
  fingerprint_2: z.string().optional(),
  fingerprint_3: z.string().optional(),
}).passthrough()

export const LicenseActivateResponseSchema = z.object({
  activated: z.boolean().optional(),
  license: LicenseInfoSchema.optional(),
  message: z.string().optional(),
}).passthrough()

export function parseLicenseInfo(data: unknown): LicenseInfo {
  return LicenseInfoSchema.parse(data) as LicenseInfo
}

export function parseLicenseActivateResponse(data: unknown) {
  return LicenseActivateResponseSchema.parse(data)
}
