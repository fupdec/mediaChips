import {defineStore} from 'pinia'
import _ from 'lodash'
import {getRandomId} from '@/services/formatUtils'

export const useContextMenu = defineStore('contextMenu', {
  state: () => ({
    show: false,
    content: null,
    tagMeta: null,
    x: 0,
    y: 0,
  }),
  actions: {
    showContextMenu(contextMenuObj) {
      const parseMenu = (entry) => {
        for (let i of entry) {
          i.id = getRandomId()
          i.show = false
          if (i.type === 'menu' && i.menu) parseMenu(i.menu)
        }
      }

      // Клонируем объект меню
      const contextMenu = _.cloneDeep(contextMenuObj)

      // Парсим меню если есть content
      if (contextMenu.content) {
        parseMenu(contextMenu.content)
      }

      // Используем setTimeout для отложенного выполнения
      setTimeout(() => {
        // Вместо this.state используем прямое присваивание свойств
        this.x = contextMenu.x || 0
        this.y = contextMenu.y || 0
        this.content = contextMenu.content || null
        this.tagMeta = contextMenu.tagMeta || null
        this.show = true
      }, 10)
    },
  }
})

export default useContextMenu
