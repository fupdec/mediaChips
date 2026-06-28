import type { ApiDb, AnyRecord, MediaLike, FilterLike, TagLike, MetaLike } from '../types/db'

const {Op} = require('sequelize')

const BATCH_SIZE = 200

function chunkArray(items: AnyRecord[], size: any= BATCH_SIZE) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function getModels(db: ApiDb, itemType: any) {
  if (itemType === 'media') {
    return {
      tagsModel: db.TagsInMedia,
      valuesModel: db.ValuesInMedia,
      itemIdField: 'mediaId',
    }
  }

  if (itemType === 'tag') {
    return {
      tagsModel: db.TagsInTag,
      valuesModel: db.ValuesInTag,
      itemIdField: 'parentTagId',
      valueItemIdField: 'tagId',
    }
  }

  return null
}

async function destroyTagsForMeta(tagsModel: any, itemIdField: any, itemIds: any, metaId: any) {
  for (const batch of chunkArray(itemIds)) {
    await tagsModel.destroy({
      where: {
        [itemIdField]: {[Op.in]: batch},
        metaId,
      },
    })
  }
}

async function destroyValuesForMeta(valuesModel: any, itemIdField: any, valueItemIdField: any, itemIds: any, metaId: any) {
  for (const batch of chunkArray(itemIds)) {
    await valuesModel.destroy({
      where: {
        [valueItemIdField || itemIdField]: {[Op.in]: batch},
        metaId,
      },
    })
  }
}

function buildTagRows(itemType: any, itemIdField: any, itemIds: any, metaId: any, tagIds: any) {
  const rows = []

  for (const itemId of itemIds) {
    for (const tagId of tagIds) {
      if (itemType === 'media') {
        rows.push({mediaId: itemId, metaId, tagId})
      } else {
        rows.push({parentTagId: itemId, metaId, tagId})
      }
    }
  }

  return rows
}

function buildValueRows(itemType: any, itemIds: any, metaId: any, value: any) {
  if (itemType === 'media') {
    return itemIds.map((itemId: any) => ({
      mediaId: itemId,
      metaId,
      value,
    }))
  }

  return itemIds.map((itemId: any) => ({
    tagId: itemId,
    metaId,
    value,
  }))
}

const PRESET_FIELDS = new Set(['rating', 'favorite', 'views'])

function normalizePresetValue(field: any, editType: any, value: any) {
  if (editType === 1) {
    if (field === 'favorite') return false
    return 0
  }

  if (field === 'favorite') {
    return value === true || value === 1 || value === '1'
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

async function applyPresetBulkEdit(db: ApiDb, itemType: any, itemIds: any, presetChanges: any= []) {
  const Model = itemType === 'media' ? db.Media : db.Tag
  let appliedChanges = 0

  for (const change of presetChanges) {
    const editType = Number(change.editType)
    if (!editType || editType === 3) continue

    const field = change.field
    if (!PRESET_FIELDS.has(field)) continue

    const value = normalizePresetValue(field, editType, change.value)
    const updatePayload = {[field]: value}

    for (const batch of chunkArray(itemIds)) {
      await Model.update(updatePayload, {
        where: {id: {[Op.in]: batch}},
      })
    }

    appliedChanges += 1
  }

  return appliedChanges
}

async function applyBulkMetaEdit(db: ApiDb, {itemType, itemIds = [], changes = [], presetChanges = []}: any) {
  const models = getModels(db, itemType)
  if (!models) {
    throw new Error(`Unsupported item type: ${itemType}`)
  }

  const uniqueItemIds = [...new Set(itemIds.filter(Boolean))]
  if (!uniqueItemIds.length) {
    return {updated: 0, changes: 0}
  }

  const {tagsModel, valuesModel, itemIdField, valueItemIdField} = models
  let appliedChanges = 0

  for (const change of changes) {
    const editType = Number(change.editType)
    if (!editType) continue

    const metaId = Number(change.metaId)
    const metaType = change.metaType
    const value = change.value

    if (editType === 1 || editType === 2) {
      if (metaType === 'array') {
        await destroyTagsForMeta(tagsModel, itemIdField, uniqueItemIds, metaId)
      } else {
        await destroyValuesForMeta(
          valuesModel,
          itemIdField,
          valueItemIdField,
          uniqueItemIds,
          metaId,
        )
      }
    }

    if (editType === 2) {
      if (metaType === 'array') {
        const tagIds = Array.isArray(value) ? value : []
        const rows = buildTagRows(itemType, itemIdField, uniqueItemIds, metaId, tagIds)

        for (const batch of chunkArray(rows, 500)) {
          if (batch.length) {
            await tagsModel.bulkCreate(batch, {ignoreDuplicates: true})
          }
        }
      } else {
        const rows = buildValueRows(itemType, uniqueItemIds, metaId, value)

        for (const batch of chunkArray(rows, 500)) {
          if (batch.length) {
            await valuesModel.bulkCreate(batch)
          }
        }
      }
    } else if (editType === 3 && metaType === 'array') {
      const tagIds = Array.isArray(value) ? value : []
      const rows = buildTagRows(itemType, itemIdField, uniqueItemIds, metaId, tagIds)

      for (const batch of chunkArray(rows, 500)) {
        if (batch.length) {
          await tagsModel.bulkCreate(batch, {ignoreDuplicates: true})
        }
      }
    }

    appliedChanges += 1
  }

  const presetApplied = await applyPresetBulkEdit(
    db,
    itemType,
    uniqueItemIds,
    presetChanges,
  )

  return {
    updated: uniqueItemIds.length,
    changes: appliedChanges + presetApplied,
  }
}

module.exports = {
  applyBulkMetaEdit,
}
