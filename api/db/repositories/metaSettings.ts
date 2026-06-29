import { eq } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { metaSettings } from '../schema/metaSettings'

export type MetaSettingRow = typeof metaSettings.$inferSelect

export function createMetaSettingsRepository(db: DrizzleClient) {
  return {
    findByMetaId(metaId: number): MetaSettingRow | undefined {
      return db.select().from(metaSettings).where(eq(metaSettings.metaId, metaId)).get()
    },

    updateByMetaId(metaId: number, data: Partial<MetaSettingRow>): void {
      db.update(metaSettings)
        .set(data)
        .where(eq(metaSettings.metaId, metaId))
        .run()
    },
  }
}
