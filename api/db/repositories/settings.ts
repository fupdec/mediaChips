import { eq, inArray } from 'drizzle-orm'
import type { DrizzleClient } from '../client'
import { settings } from '../schema/settings'
import { nowIso } from '../utils/timestamps'

export type SettingRow = typeof settings.$inferSelect

export function createSettingsRepository(db: DrizzleClient) {
  return {
    findAll(): SettingRow[] {
      return db.select().from(settings).all()
    },

    findByOption(option: string): SettingRow | undefined {
      return db.select().from(settings).where(eq(settings.option, option)).get()
    },

    findByOptions(options: string[]): SettingRow[] {
      if (!options.length) return []
      return db.select().from(settings).where(inArray(settings.option, options)).all()
    },

    upsertByOption(option: string, value: unknown): {created: boolean} {
      const existing = db.select().from(settings).where(eq(settings.option, option)).get()
      const serializedValue = value == null ? null : String(value)
      const timestamp = nowIso()

      if (existing) {
        db.update(settings)
          .set({value: serializedValue, updatedAt: timestamp})
          .where(eq(settings.option, option))
          .run()
        return {created: false}
      }

      db.insert(settings)
        .values({
          option,
          value: serializedValue,
          createdAt: timestamp,
          updatedAt: timestamp,
        })
        .run()

      return {created: true}
    },

    bulkUpsertByOptions(items: Array<{option: string; value: unknown}>): void {
      for (const item of items) {
        this.upsertByOption(item.option, item.value)
      }
    },

    findOrCreateByOption(option: string, value: unknown): {row: SettingRow; created: boolean} {
      const existing = this.findByOption(option)
      if (existing) {
        return {row: existing, created: false}
      }

      this.upsertByOption(option, value)
      const row = this.findByOption(option)
      if (!row) {
        throw new Error(`Failed to create setting: ${option}`)
      }

      return {row, created: true}
    },
  }
}
