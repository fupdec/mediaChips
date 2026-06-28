// app/tasks/items.js - исправленный ES модуль

import _ from "lodash";
import type { DbItemRow, ParsedItem, ParsedItemTags } from '../types/items'
import type { AnyRecord } from '../../api/types/db'
import type { FilterLike } from '../../api/types/db'
const FilterCols = require('../configs/filter-cols')
const { parseCountries } = require('../../api/utils/country')
const { normalizeExt, parseExtList } = require('../../api/utils/ext')

const parseItemsFromDb = (items: DbItemRow[]) => {
  const parseTagsAndValues = (item: DbItemRow): ParsedItemTags => {
    let data: ParsedItemTags = {
      tags: [],
      values: [],
      key: `${item.id}_${Date.now()}`,
    }

    let item_tags = item.media_tags || item.tag_tags;
    let item_values = item.media_values || item.tag_values;

    if (item_tags) {
      const tagRows = item_tags.split(/,(?=[^,]*\^)/).map((entry) => entry.split('^'));
      for (const row of tagRows) {
        data.tags.push({
          tagId: Number(row[0]),
          metaId: Number(row[1]),
        });
      }
    }
    if (item_values) {
      const valueRows = item_values.split(/,(?=[^,]*\^)/).map((entry) => entry.split('^'));
      for (const row of valueRows) {
        data.values.push({
          value: row[0],
          metaId: Number(row[1]),
        });
      }
    }
    return data;
  }

  let parsed: ParsedItem[] = []
  for (let item of items) {
    const parsedData = parseTagsAndValues(item);

    // удаляем ненужные ключи из предметов, где была строка с айдишниками
    delete item.media_tags;
    delete item.media_values;
    delete item.tag_tags;
    delete item.tag_values;

    let index = _.findIndex(parsed, {id: item.id});
    if (index > -1) {
      const existing = parsed[index]
      let tags = [...existing.tags, ...parsedData.tags]
      let values = [...existing.values, ...parsedData.values]
      tags = _.uniqBy(tags, 'tagId')
      values = _.uniqBy(values, 'metaId')
      const replaced: ParsedItem = {...existing, tags, values}
      parsed.splice(index, 1, replaced);
    } else {
      const merged: ParsedItem = {...item, ...parsedData};
      parsed.push(merged);
    }
  }
  return parsed;
}

const resolveMetaId = (param: unknown) => {
  if (typeof param === 'number' && Number.isFinite(param)) return param
  if (typeof param === 'string') {
    const trimmed = param.trim()
    if (!trimmed) return null
    if (/^\d+$/.test(trimmed)) return Number(trimmed)
    const num = Number(trimmed)
    if (Number.isFinite(num) && Number.isInteger(num)) return num
  }
  return null
}

const isTruthyValue = (value: unknown) => (
  value === '1' || value === 1 || value === true || value === 'true' || value === 'TRUE'
)

const filterItems = (
  filters_all: FilterLike[],
  type: string,
  items: ParsedItem[],
  sortBy: string,
  direction: string,
  find_duplicates: boolean,
  duplicates_by = 'filesize',
) => {
  // отсеиваем неактивные и без условий (в случае бага)
  let filters = filters_all.filter((i: FilterLike) => {
    const isActive = i.active === true || i.active === 1 || i.active === '1'
    return isActive && i.cond
  })

  // Исправляем обращение к FilterCols
  let videoCols = [];
  if (FilterCols && FilterCols.video) {
    videoCols = FilterCols.video.map((i: { param: string }) => i.param);
  } else if (FilterCols.default && FilterCols.default.video) {
    videoCols = FilterCols.default.video.map((i: { param: string }) => i.param);
  }

  let imageCols = [];
  if (FilterCols && FilterCols.image) {
    imageCols = FilterCols.image.map((i: { param: string }) => i.param);
  } else if (FilterCols.default && FilterCols.default.image) {
    imageCols = FilterCols.default.image.map((i: { param: string }) => i.param);
  }

  const mediaMetadataCols = [...new Set([...videoCols, ...imageCols])];
  const isFilterByVideo = filters.some((i: FilterLike) => mediaMetadataCols.includes(i.param))
  const isFilterByMetaValue = filters.some((i: FilterLike) => i.type !== 'array' && _.isNumber(i.param))
  const isFilterTypeArray = filters.some((i: FilterLike) => i.type === 'array')
  let array_count = 0; // для подсчета фильтров с типом массив

  const filterItem = (item: ParsedItem) => {
    const compareNumber = (sign: string | undefined, filterValue: unknown, itemValue: unknown) => {
      const a = Number(filterValue)
      const b = Number(itemValue)
      if (Number.isNaN(a) || Number.isNaN(b)) return false

      if (sign === 'equal' || sign === '=') return b === a
      if (sign === 'not equal' || sign === '!==') return b !== a
      if (sign === 'greater than' || sign === '>') return b > a
      if (sign === 'less than' || sign === '<') return b < a
      if (sign === 'greater than or equal' || sign === '>=') return b >= a
      if (sign === 'less than or equal' || sign === '<=') return b <= a
      return false
    }

    let filters_matches = [];

    for (let filter of filters) {
      let by = filter.param
      let cond = filter.cond
      let val = filter.val
      let type = filter.type
      let flag = filter.flag
      let is_match = false;
      const metaId = resolveMetaId(by)
      let item_val

      if (metaId !== null) {
        const found = item.values?.find((entry) => Number(entry.metaId) === metaId)
        item_val = found?.value
      } else if (typeof by === 'string' || typeof by === 'number') {
        item_val = item[by as keyof ParsedItem]
      }

      if (type == 'string' && typeof val === 'string') val = val.toLowerCase().trim()
      if (type === 'boolean') {
        is_match = isTruthyValue(item_val)
        if (cond === '!=') {
          is_match = !is_match;
        }
      } else if (type === 'date') {
        const itemDate = new Date(String(item_val ?? ''))
        const filterDate = new Date(String(val ?? ''))
        if (Number.isNaN(itemDate.getTime()) || Number.isNaN(filterDate.getTime())) {
          is_match = false
        } else {
          is_match = compareNumber(cond, filterDate.getTime(), itemDate.getTime())
        }
      } else if (type === 'number' || type === 'rating') {
        if (item_val === null || item_val === undefined || item_val === '') {
          is_match = false
        } else if (val === null || val === undefined || val === '') {
          is_match = false
        } else {
          is_match = compareNumber(cond, val, item_val)
        }
      } else if (type === 'string') {
        const itemText = String(item_val ?? '')
        const filterText = String(val ?? '')
        if (cond == 'includes' || cond == 'like') {
          is_match = itemText ? itemText.toLowerCase().includes(filterText) : false
        } else if (cond == 'excludes' || cond == 'not like') {
          is_match = itemText ? !itemText.toLowerCase().includes(filterText) : true
        } else if (cond == 'is null') {
          is_match = !item_val;
        } else if (cond == 'not null') {
          is_match = Boolean(item_val);
        } else if (cond == 'regex') {
          const regex = new RegExp(filterText, 'i');
          is_match = Boolean(itemText.match(regex));
        }
      } else if (type === 'array' || type === 'select') {
        let tags: Array<number | string> = []
        if (by === 'country') {
          if (!_.isEmpty(item.country)) {
            tags = parseCountries(String(item.country))
          }
        } else if (by === 'ext') {
          const normalizedExt = normalizeExt(item_val)
          if (normalizedExt) tags = [normalizedExt]
          val = parseExtList(val)
        } else if (metaId !== null) {
          tags = item.tags
            .filter((entry) => Number(entry.metaId) === metaId)
            .map((entry) => entry.tagId)
        }

        const filterValues = Array.isArray(val) ? val : []

        if (cond === 'is null') { // пусто
          is_match = _.isEmpty(tags);
        } else if (cond === 'not null') { // не пусто
          is_match = !_.isEmpty(tags);
        } else if (cond === 'not in') {
          is_match = !tags.some((tagId) => filterValues.includes(tagId))
        } else if (cond === 'not in all') { // исключая все
          if (!filterValues.length) {
            is_match = !_.isEmpty(tags);
          } else {
            is_match = !filterValues.every((entry) => tags.includes(entry))
          }
        } else if (!_.isEmpty(filterValues) && !_.isEmpty(tags)) { // если есть значения
          if (cond === 'in') { // включая один из
            is_match = tags.some((tagId) => filterValues.includes(tagId))
          } else if (cond === 'in all') { // включая все
            is_match = filterValues.every((entry) => tags.includes(entry))
          }
        }
      }
      filters_matches.push(is_match);
    }
    return filters_matches.every(Boolean);
  }

  let result: ParsedItem[] = items

  if (find_duplicates) {
    const groupKey = duplicates_by === 'path' ? 'path' : 'filesize'
    let grouped_items = _.groupBy(result, groupKey);
    let items_dups: ParsedItem[] = []
    for (let key in grouped_items) {
      if (grouped_items[key].length > 1) {
        items_dups = [...items_dups, ...grouped_items[key]];
      }
    }
    result = items_dups;
  } else {
    result = result.filter((item) => filterItem(item));
  }

  if (sortBy === 'shuffle') {
    result = _.shuffle(result);
  } else {
    result = _.orderBy(result, [sortBy], [direction as 'asc' | 'desc']);
  }

  return result;
}

// ✅ Правильный экспорт для ES модулей (Vite/Vue 3)
export { parseItemsFromDb, filterItems };

// ✅ Альтернативно можно экспортировать по умолчанию
// export default { parseItemsFromDb, filterItems };