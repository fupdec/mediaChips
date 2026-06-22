const {Op} = require('sequelize')

const BATCH_SIZE = 200

function chunkArray(items, size = BATCH_SIZE) {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

function getModels(db, itemType) {
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

async function destroyTagsForMeta(tagsModel, itemIdField, itemIds, metaId) {
  for (const batch of chunkArray(itemIds)) {
    await tagsModel.destroy({
      where: {
        [itemIdField]: {[Op.in]: batch},
        metaId,
      },
    })
  }
}

async function destroyValuesForMeta(valuesModel, itemIdField, valueItemIdField, itemIds, metaId) {
  for (const batch of chunkArray(itemIds)) {
    await valuesModel.destroy({
      where: {
        [valueItemIdField || itemIdField]: {[Op.in]: batch},
        metaId,
      },
    })
  }
}

function buildTagRows(itemType, itemIdField, itemIds, metaId, tagIds) {
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

function buildValueRows(itemType, itemIds, metaId, value) {
  if (itemType === 'media') {
    return itemIds.map((itemId) => ({
      mediaId: itemId,
      metaId,
      value,
    }))
  }

  return itemIds.map((itemId) => ({
    tagId: itemId,
    metaId,
    value,
  }))
}

async function applyBulkMetaEdit(db, {itemType, itemIds = [], changes = []}) {
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

  return {
    updated: uniqueItemIds.length,
    changes: appliedChanges,
  }
}

module.exports = {
  applyBulkMetaEdit,
}
