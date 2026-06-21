import {toRaw} from 'vue'
import {defineStore} from 'pinia'
import {useAppStore} from '@/stores/app'
import {useSettingsStore} from '@/stores/settings'
import {useEventBus} from '@/utils/eventBus'
import axios from "axios"
import _ from "lodash"

const eventBus = useEventBus()

export const useItemsStore = defineStore('items', {
  // Состояние (State)
  state: () => ({
    type: '',
    environment: {
      media_type_id: null,
      meta_id: null,
      tag_id: null,
      tab_id: null
    },
    page: 1,
    jumpPage: null,
    limit: 20,
    filterId: null,
    size: 3,
    view: 1,
    sortBy: 'name',
    sortDir: 'asc',
    entities: [],
    itemsOnPage: [],
    name: 'Tags',
    nameSingular: 'Tag',
    icon: 'shape',
    isSelect: false,
    selected_last: null,
    selection: [],
    savedFilter: {},
    filters: [],
    filters_saved: [],
    meta: {},
    assigned: [],
    isFiltersLoaded: false,
    find_duplicates: false,
  }),

  // Геттеры (Getters) - опциональные, но полезные
  getters: {
    // Получить количество элементов на странице
    itemsOnPageCount: (state) => state.itemsOnPage.length,

    // Получить общее количество элементов
    totalEntities: (state) => state.entities.length,

    // Проверить, есть ли выбранные элементы
    hasSelection: (state) => state.selection.length > 0,

    // Получить количество выбранных элементов
    selectionCount: (state) => state.selection.length,

    // Проверить, выбраны ли все элементы на странице
    isAllSelectedOnPage: (state) => {
      if (state.itemsOnPage.length === 0) return false
      return state.itemsOnPage.every(item =>
        state.selection.includes(item.id)
      )
    },

    // Получить активные фильтры
    activeFilters: (state) => state.filters.filter(f => f.active),

    // Проверить, изменены ли фильтры по сравнению с сохраненными
    isFiltersChanged: (state) => {
      if (!state.savedFilter || !state.savedFilter.filters) return false
      return JSON.stringify(state.filters) !== JSON.stringify(state.savedFilter.filters)
    },

    // Геттер с параметрами - найти элемент по ID
    getItemById: (state) => (id) => {
      return state.entities.find(item => item.id === id) ||
        state.itemsOnPage.find(item => item.id === id)
    },

    // Получить текущую страницу для пагинации
    currentPageInfo: (state) => {
      const start = (state.page - 1) * state.limit + 1
      const end = Math.min(state.page * state.limit, state.entities.length)
      return {start, end, total: state.entities.length}
    },

    // Геттер, который гарантированно возвращает массив
    safeAssigned: (state) => {
      if (Array.isArray(state.assigned)) {
        return state.assigned;
      }
      if (state.assigned && typeof state.assigned === 'object') {
        return Object.values(state.assigned);
      }
      return [];
    },

    // Отсортированный массив assigned
    sortedAssigned: (state) => {
      const assigned = Array.isArray(state.assigned)
        ? state.assigned
        : (state.assigned && typeof state.assigned === 'object'
          ? Object.values(state.assigned)
          : []);

      return [...assigned].sort((a, b) => {
        const nameA = a.meta?.name || '';
        const nameB = b.meta?.name || '';
        return nameA.localeCompare(nameB);
      });
    }
  },

  // Действия (Actions)
  actions: {

    async viewImage({image, in_system}) {
      const isFileExists = await $operable.checkFileExists(image.path)

      if (!isFileExists) {
        $operable.setNotification({
          type: 'error',
          title: 'File not found on path',
          text: image.path
        })
        return
      }

      if (in_system) {
        await $operable.openPath(image.path)
        await this.countViewNumber(image, 'media')
        return
      }

      let images = [toRaw(image)]

      if (this.entities.length > 0) {
        images = this.entities.map(item => toRaw(item))

        if (image.mediaTypeId) {
          images = images.filter(item => item.mediaTypeId === image.mediaTypeId)
        }
      }

      let index = images.findIndex(item => item.id === image.id)
      if (index < 0) index = 0

      await this.countViewNumber(image, 'media')

      eventBus.emit('viewImage', {
        images,
        index,
      })
    },

    async playVideo({video, time, in_system}) {
      const settingsStore = useSettingsStore()

      const isFileExists = await $operable.checkFileExists(video.path)

      if (!isFileExists) {
        $operable.setNotification({
          type: 'error',
          title: 'File not found on path',
          text: video.path
        })
        return
      }

      if (in_system || settingsStore.isPlayVideoInSystemPlayer === "1") {
        await $operable.openPath(video.path)

        await this.countViewNumber(video, 'media')
      } else {
        // Преобразуем Proxy объекты в обычные
        let videos = [toRaw(video)];

        if (this.entities.length > 0) {
          videos = this.entities.map(item => toRaw(item));
        }

        const data = {
          video: toRaw(video),
          videos: videos,
          time: time || 0
        };

        if (settingsStore.open_player_in_separate_window == '1' && window.electronAPI?.send) {
          window.electronAPI.send("open-player", data);
        } else {
          eventBus.emit("playVideo", data);
        }
      }
    },

    async countViewNumber(item, itemType) {
      const appStore = useAppStore()
      const settingsStore = useSettingsStore()

      if (settingsStore.count_number_of_views === '1') {

        await axios({
          method: "put",
          url: appStore.localhost + `/api/media/` + item.id,
          data: {
            views: item.views + 1,
            viewedAt: $readable.getDateForDB(),
            silent: true,
          },
        })

        // Эмит события для обновления
        eventBus.emit('getItemsFromDb', {
          ids: [item.id],
          type: itemType || 'media',
        })
      }
    },

    clearSavedFilters() {
      this.filters = [];
      this.savedFilter = {};
    },

    // Метод для безопасного установки assigned
    setAssigned(data) {
      if (Array.isArray(data)) {
        this.assigned = data;
      } else if (data && typeof data === 'object') {
        this.assigned = Object.values(data);
      } else {
        this.assigned = [];
      }
    },

    // Или более гибкий метод
    updateAssigned(updates) {
      if (Array.isArray(updates)) {
        this.assigned = updates;
      } else if (updates && typeof updates === 'object') {
        // Если updates - объект, добавляем/обновляем элементы
        if (Array.isArray(this.assigned)) {
          // Ищем существующие элементы для обновления
          const updated = [...this.assigned];
          Object.entries(updates).forEach(([key, value]) => {
            const existingIndex = updated.findIndex(item => item.id == key);
            if (existingIndex > -1) {
              updated[existingIndex] = {...updated[existingIndex], ...value};
            } else {
              updated.push(value);
            }
          });
          this.assigned = updated;
        } else {
          this.assigned = Object.values(updates);
        }
      }
    },

    // Обновить одно свойство состояния
    updateState({key, value}) {
      if (key in this.$state) {
        this[key] = value
      } else {
        console.warn(`Key "${key}" does not exist in items store`)
      }
    },

    // Обновить несколько свойств одновременно
    updateMultiple(updates) {
      Object.entries(updates).forEach(([key, value]) => {
        if (key in this.$state) {
          this[key] = value
        }
      })
    },

    // Обновить environment (специальный метод для вложенного объекта)
    updateEnvironment(updates) {
      this.environment = {...this.environment, ...updates}
    },

    // Удалить элемент по ID
    removeItem(id) {
      // Удалить с текущей страницы
      const indexPage = this.itemsOnPage.findIndex(i => i.id === id)
      if (indexPage > -1) {
        this.itemsOnPage.splice(indexPage, 1)
      }

      // Удалить из всех элементов
      const indexEntities = this.entities.findIndex(i => i.id === id)
      if (indexEntities > -1) {
        this.entities.splice(indexEntities, 1)
      }

      // Удалить из выбранных, если там есть
      const selectionIndex = this.selection.indexOf(id)
      if (selectionIndex > -1) {
        this.selection.splice(selectionIndex, 1)
      }

      // Если удалили последний выбранный элемент
      if (this.selected_last === id) {
        this.selected_last = null
      }
    },

    // Обновить элемент по ID
    updateItem({id, item}) {
      // Обновить на текущей странице
      const indexPage = this.itemsOnPage.findIndex(i => i.id === id)
      if (indexPage > -1) {
        // Сохраняем существующие свойства, обновляем новыми
        this.itemsOnPage[indexPage] = {
          ...this.itemsOnPage[indexPage],
          ...item
        }
      }

      // Обновить во всех элементах
      const indexEntities = this.entities.findIndex(i => i.id === id)
      if (indexEntities > -1) {
        this.entities[indexEntities] = {
          ...this.entities[indexEntities],
          ...item
        }
      }
    },

    // Обновить поле элемента (альтернативный метод)
    updateItemField({id, field, value}) {
      // Найти элемент на текущей странице
      const itemOnPage = this.itemsOnPage.find(i => i.id === id)
      if (itemOnPage) {
        itemOnPage[field] = value
      }

      // Найти элемент во всех элементах
      const itemInEntities = this.entities.find(i => i.id === id)
      if (itemInEntities) {
        itemInEntities[field] = value
      }
    },

    // Установить поле сортировки
    setSortBy(val) {
      this.sortBy = val
    },

    // Установить направление сортировки
    setSortDir(val) {
      this.sortDir = val
    },

    // Переключить направление сортировки
    toggleSortDir() {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc'
    },

    // Селекция элементов
    toggleItemSelection(id) {
      const index = this.selection.indexOf(id)
      if (index === -1) {
        // Добавить в выбранные
        this.selection.push(id)
        this.selected_last = id
      } else {
        // Удалить из выбранных
        this.selection.splice(index, 1)
        if (this.selected_last === id) {
          this.selected_last = null
        }
      }
    },

    // Выбрать все элементы на текущей странице
    selectAllOnPage() {
      this.selection = this.itemsOnPage.map(item => item.id)
    },

    // Выбрать все элементы вообще
    selectAll() {
      this.selection = this.entities.map(item => item.id)
    },

    // Очистить выбор
    clearSelection() {
      this.selection = []
      this.selected_last = null
      this.isSelect = false
    },

    // Переключить режим выбора
    toggleSelectMode() {
      this.isSelect = !this.isSelect
      if (!this.isSelect) {
        this.clearSelection()
      }
    },

    // Переключить режим выбора
    toggleSelect(e, item) {
      if (!this.isSelect) {
        this.toggleSelectMode()
      }

      const id = item.id;
      let selection = this.selection;
      // выделяем предметы при зажатой кнопке shift
      if (e && e.shiftKey) {
        const last = this.selected_last;
        if (last && selection.length) {
          let index_last = this.entities.findIndex(i => i.id === last);
          let index_current = this.entities.findIndex(i => i.id === id);

          if (index_last > -1 && index_current > -1) {
            let start = index_current;
            let end = index_last;

            if (index_current > index_last) {
              start = index_last;
              end = index_current;
            }

            let section = this.entities.slice(start + 1, end + 1);
            let ids = section.map(i => i.id);
            if (!ids.includes(id)) {
              ids.push(id);
            }

            for (let i of ids) {
              if (selection.includes(i)) {
                const x = selection.findIndex((j) => j == i);
                if (x > -1) selection.splice(x, 1);
              } else {
                selection.push(i)
              }
            }
          }
        }
      } else {
        if (selection.includes(id)) {
          const x = selection.findIndex((i) => i == id);
          if (x > -1) selection.splice(x, 1);
        } else selection.push(id);
      }

      selection.sort();
      this.selected_last = id;
    },

    // Добавить фильтр
    addFilter(filter) {
      this.filters.push(filter)
    },

    // Удалить фильтр по индексу
    removeFilter(index) {
      if (index >= 0 && index < this.filters.length) {
        this.filters.splice(index, 1)
      }
    },

    // Очистить все фильтры
    clearFilters() {
      this.filters = []
    },

    // Обновить фильтр по индексу
    updateFilter(index, updates) {
      if (index >= 0 && index < this.filters.length) {
        this.filters[index] = {...this.filters[index], ...updates}
      }
    },

    // Переключить активность фильтра
    toggleFilterActive(index) {
      if (index >= 0 && index < this.filters.length) {
        this.filters[index].active = !this.filters[index].active
      }
    },

    // Сохранить текущие фильтры как savedFilter
    saveCurrentFilters(name) {
      this.savedFilter = {
        name: name || `Saved Filter ${new Date().toLocaleString()}`,
        filters: [...this.filters],
        savedAt: new Date().toISOString()
      }
    },

    // Загрузить savedFilter в текущие фильтры
    loadSavedFilter() {
      if (this.savedFilter && this.savedFilter.filters) {
        this.filters = [...this.savedFilter.filters]
      }
    },

    // Перейти на следующую страницу
    nextPage() {
      const totalPages = Math.ceil(this.entities.length / this.limit)
      if (this.page < totalPages) {
        this.page++
        this.updateItemsOnPage()
      }
    },

    // Перейти на предыдущую страницу
    previousPage() {
      if (this.page > 1) {
        this.page--
        this.updateItemsOnPage()
      }
    },

    // Перейти на конкретную страницу
    goToPage(pageNumber) {
      const totalPages = Math.ceil(this.entities.length / this.limit)
      if (pageNumber >= 1 && pageNumber <= totalPages) {
        this.page = pageNumber
        this.updateItemsOnPage()
      }
    },

    // Обновить элементы на текущей странице (пагинация)
    updateItemsOnPage() {
      const start = (this.page - 1) * this.limit
      const end = start + this.limit
      this.itemsOnPage = this.entities.slice(start, end)
    },

    // Обновить entities и автоматически обновить itemsOnPage
    setEntities(newEntities) {
      this.entities = newEntities
      this.updateItemsOnPage()
    },

    // Добавить элементы к существующим entities
    addEntities(newEntities) {
      this.entities = [...this.entities, ...newEntities]
      this.updateItemsOnPage()
    },

    // Сбросить состояние к начальным значениям
    resetState() {
      this.$reset() // Встроенный метод Pinia для сброса к initialState
      // Дополнительный сброс если нужно
      this.environment = {
        media_type_id: null,
        meta_id: null,
        tag_id: null,
        tab_id: null
      }
    },

    // Частичный сброс (только определенные поля)
    resetPartial(fields = []) {
      const initialState = this.$state()
      fields.forEach(field => {
        if (field in initialState) {
          this[field] = initialState[field]
        }
      })
    }
  }
})

export default useItemsStore