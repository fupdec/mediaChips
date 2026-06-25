// app/tasks/items.js - исправленный ES модуль

import _ from "lodash";
import * as FilterCols from '../configs/filter-cols.mjs';
import { parseCountries } from '../../api/utils/country.js'

const parseItemsFromDb = (items) => {
  const parseTagsAndValues = (item) => {
    let data = {
      tags: [],
      values: [],
      key: `${item.id}_${Date.now()}`,
    }

    let item_tags = item.media_tags || item.tag_tags;
    let item_values = item.media_values || item.tag_values;

    if (item_tags) {
      item_tags = item_tags.split(/,(?=[^,]*\^)/);
      item_tags = item_tags.map(i => i.split('^'));
      for (let i of item_tags) {
        data.tags.push({
          tagId: Number(i[0]),
          metaId: Number(i[1]),
        });
      }
    }
    if (item_values) {
      item_values = item_values.split(/,(?=[^,]*\^)/);
      item_values = item_values.map(i => i.split('^'));
      for (let i of item_values) {
        data.values.push({
          value: i[0],
          metaId: Number(i[1]),
        });
      }
    }
    return data;
  }

  let parsed = []
  for (let item of items) {
    const parsedData = parseTagsAndValues(item);

    // удаляем ненужные ключи из предметов, где была строка с айдишниками
    delete item.media_tags;
    delete item.media_values;
    delete item.tag_tags;
    delete item.tag_values;

    let index = _.findIndex(parsed, {id: item.id});
    if (index > -1) {
      let tags = [...parsed[index].tags, ...parsedData.tags]
      let values = [...parsed[index].values, ...parsedData.values]
      tags = _.uniqBy(tags, 'tagId')
      values = _.uniqBy(values, 'metaId')
      const replaced = {...parsed[index], ...{tags, values}}
      parsed.splice(index, 1, replaced);
    } else {
      item = {...item, ...parsedData};
      parsed.push(item);
    }
  }
  return parsed;
}

const resolveMetaId = (param) => {
  if (typeof param === 'number' && Number.isFinite(param)) return param
  if (typeof param === 'string' && /^\d+$/.test(param)) return Number(param)
  return null
}

const filterItems = (filters_all, type, items, sortBy, direction, find_duplicates, duplicates_by = 'filesize') => {
  // отсеиваем неактивные и без условий (в случае бага)
  let filters = filters_all.filter(i => {
    const isActive = i.active === true || i.active === 1 || i.active === '1'
    return isActive && i.cond
  })

  // Исправляем обращение к FilterCols
  let videoCols = [];
  if (FilterCols && FilterCols.video) {
    videoCols = FilterCols.video.map(i => i.param);
  } else if (FilterCols.default && FilterCols.default.video) {
    videoCols = FilterCols.default.video.map(i => i.param);
  }

  let imageCols = [];
  if (FilterCols && FilterCols.image) {
    imageCols = FilterCols.image.map(i => i.param);
  } else if (FilterCols.default && FilterCols.default.image) {
    imageCols = FilterCols.default.image.map(i => i.param);
  }

  const mediaMetadataCols = [...new Set([...videoCols, ...imageCols])];
  const isFilterByVideo = filters.some(i => mediaMetadataCols.includes(i.param))
  const isFilterByMetaValue = filters.some(i => i.type !== 'array' && _.isNumber(i.param))
  const isFilterTypeArray = filters.some(i => i.type === 'array')
  let array_count = 0; // для подсчета фильтров с типом массив

  const filterItem = (item) => {
    const compareNumber = (sign, filterValue, itemValue) => {
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
        const found = item.values?.find(i => Number(i.metaId) === metaId)
        item_val = found?.value
      } else {
        item_val = item[by]
      }

      if (type == 'string' && val) val = val.toLowerCase().trim()
      if (type === 'boolean') {
        is_match = item_val === '1' || item_val === 1
        if (cond === '!=') {
          is_match = !is_match;
        }
      } else if (type === 'date') {
        item_val = new Date(item_val)
        val = new Date(val)
        if (Number.isNaN(item_val.getTime()) || Number.isNaN(val.getTime())) {
          is_match = false
        } else {
          is_match = compareNumber(cond, val.getTime(), item_val.getTime())
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
        if (cond == 'includes' || cond == 'like') {
          if (item_val) {
            is_match = item_val.toLowerCase().includes(val);
          } else {
            is_match = false;
          }
        } else if (cond == 'excludes' || cond == 'not like') {
          if (item_val) {
            is_match = !item_val.toLowerCase().includes(val);
          } else {
            is_match = false;
          }
        } else if (cond == 'is null') {
          is_match = !item_val;
        } else if (cond == 'not null') {
          is_match = item_val;
        } else if (cond == 'regex') {
          const regex = new RegExp(val, 'i');
          is_match = item_val.match(regex);
        }
      } else if (type === 'array' || type === 'select') {
        let tags = []
        if (by === 'country') {
          if (!_.isEmpty(item.country)) {
            tags = parseCountries(item.country)
          }
        } else if (metaId !== null) {
          tags = item.tags.filter(i => Number(i.metaId) === metaId)
          tags = tags.map(i => i.tagId)
        }

        if (cond === 'is null') { // пусто
          is_match = _.isEmpty(tags);
        } else if (cond === 'not null') { // не пусто
          is_match = !_.isEmpty(tags);
        } else if (cond === 'not in') {
          is_match = !tags.some(i => val && val.includes(i))
        } else if (cond === 'not in all') { // исключая все
          if (!val) {
            is_match = !_.isEmpty(tags);
          } else {
            is_match = !val.every(i => tags.includes(i))
          }
        } else if (!_.isEmpty(val) && !_.isEmpty(tags)) { // если есть значения
          if (cond === 'in') { // включая один из
            is_match = tags.some(i => val && val.includes(i))
          } else if (cond === 'in all') { // включая все
            is_match = val.every(i => tags.includes(i))
          }
        }
      }
      filters_matches.push(is_match);
    }
    return filters_matches.every(i => i);
  }

  if (find_duplicates) {
    const groupKey = duplicates_by === 'path' ? 'path' : 'filesize'
    let grouped_items = _.groupBy(items, groupKey);
    let items_dups = []
    for (let key in grouped_items) {
      if (grouped_items[key].length > 1) {
        items_dups = [...items_dups, ...grouped_items[key]];
      }
    }
    items = items_dups;
  } else {
    items = items.filter(i => filterItem(i));
  }

  if (sortBy === 'shuffle') {
    items = _.shuffle(items);
  } else {
    items = _.orderBy(items, sortBy, direction);
  }

  return items;
}

// ✅ Правильный экспорт для ES модулей (Vite/Vue 3)
export { parseItemsFromDb, filterItems };

// ✅ Альтернативно можно экспортировать по умолчанию
// export default { parseItemsFromDb, filterItems };