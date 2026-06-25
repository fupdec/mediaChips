import MetaTypes from '@/assets/MetaTypes.js'
import useItemsStore from "@/stores/items";

export default {
  install(app, options = {}) {
    const {router, store, i18n} = options

    const readable = {
      checkCurrentPage(page) {
        return router.currentRoute.value.path.includes(page)
      },

      getRandomId() {
        return Math.random().toString(16).slice(2)
      },

      getFilterObject(obj) {
        return {
          id: null,
          param: null,
          type: null,
          cond: null,
          val: null,
          note: null,
          active: true,
          lock: false,
          ...obj,
        }
      },

      getReadableFileSize(bytes, isObject = false) {
        let result = {number: bytes, text: ''}

        if (bytes > 1e12) {
          result.number = (bytes / 1024 / 1024 / 1024 / 1024 - 0.01).toFixed(2)
          result.text = 'TB'
        } else if (bytes > 1e9) {
          result.number = (bytes / 1024 / 1024 / 1024 - 0.01).toFixed(2)
          result.text = 'GB'
        } else if (bytes > 1e6) {
          result.number = (bytes / 1024 / 1024 - 0.01).toFixed(2)
          result.text = 'MB'
        } else if (bytes > 1000) {
          result.number = (bytes / 1024 - 0.01).toFixed(2)
          result.text = 'KB'
        } else {
          result.text = 'B'
        }

        return isObject ? result : `${result.number} ${result.text}`
      },

      getReadableDuration(duration) {
        let sec = Math.floor(duration)
        let h = (sec / 3600) ^ 0
        let m = ((sec - h * 3600) / 60) ^ 0
        let s = sec - h * 3600 - m * 60

        h = h > 0 ? (h < 10 ? '0' + h + ':' : h + ':') : ''
        m = m < 10 ? '0' + m : m
        s = s < 10 ? '0' + s : s

        return h + m + ':' + s
      },

      getReadableBitrate(value) {
        if (value > 1_000_000) return (value / 1024 / 1024 - 0.01).toFixed(0) + ' Mbps'
        if (value > 1000) return (value / 1024 - 0.01).toFixed(0) + ' Kbps'
        return value + ' bps'
      },

      getReadableVideoQuality(width, height) {
        if (width > height) {
          if (height < 720) return 'SD'
          if (height < 1080) return 'HD'
          if (height < 1800) return 'FHD'
          return 'UHD'
        }
        return 'Vert'
      },

      getReadableVideoHeight(width, height) {
        return height > 1800 && width > height ? '4K' : height + 'p'
      },

      getFileNameFromPath(fullPath) {
        return fullPath.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, '')
      },

      getFileExtensionFromPath(fullPath) {
        return fullPath.split('.').pop().toLowerCase()
      },

      getDateFromMs(ms) {
        const date = new Date(ms)
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
      },

      getDateForDB(ms) {
        const date = ms ? new Date(ms) : new Date()
        return date.toISOString().replace('T', ' ').replace('Z', ' +00:00')
      },

      getTextDataType(type) {
        const key = `meta.types.${type}`
        if (i18n?.global?.te(key)) {
          return i18n.global.t(key)
        }
        return MetaTypes.find(i => i.value === type)?.text || type
      },

      getIconDataType(type) {
        return MetaTypes.find(i => i.value === type)?.icon
      },

      getUrlParam(param) {
        const value = router.currentRoute.value.query[param]
        return value ? +value : null
      },

      getTabUrl(tab) {
        const params = {}

        Object.entries(tab).forEach(([key, val]) => {
          if (!val) return
          if (key === 'id') params.tabId = val
          else if (key.toLowerCase().includes('id')) params[key] = val
        })

        const searchParams = new URLSearchParams(params)
        return tab.url + '?' + searchParams.toString()
      },

      foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0

        for (let i = 0; i < query.length; i++) {
          const char = query[i]
          const x = text.indexOf(char, foundCharIndex)
          if (x === -1) return false
          foundCharIndex = x + 1
        }
        return true
      },

      highlightChars(string, query, is_default) {
        const highlight = (str, q) => {
          if (!q) return str
          const lower = str.toLowerCase()
          const index = lower.indexOf(q.toLowerCase())
          if (index >= 0) {
            return (
              str.substring(0, index) +
              '<b>' +
              str.substring(index, index + q.length) +
              '</b>' +
              str.substring(index + q.length)
            )
          }
          return str
        }

        if (is_default) return highlight(string, query)

        let res = string
        if (!query || !string) return string

        for (let i = 0; i < query.length; i++) {
          const char = query[i]
          const lastBold = res.lastIndexOf('</b>')
          if (lastBold >= 0) {
            res = res.slice(0, lastBold + 4) + highlight(res.slice(lastBold + 4), char)
          } else {
            res = highlight(res, char)
          }
        }

        return res
      },

      getTextColor(color, is_outlined) {
        if (!color) return "";
        if (is_outlined) {
          return color;
        } else {
          let value = this.checkColorForDarkText(color);
          if (value) return "white";
          else return "black";
        }
      },

      addTransparencyToGradient(gradientString, alpha = 0.75) {
        // Регулярные выражения для разных форматов цвета
        const colorRegexes = [
          // rgb(r, g, b)
          /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g,
          // rgba(r, g, b, a) - обновляем alpha
          /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/g,
          // hex #RRGGBB или #RGB
          /#([0-9a-f]{6}|[0-9a-f]{3})(?=\s|\)|,)/gi
        ];

        let result = gradientString;

        // Обрабатываем rgb и rgba
        result = result.replace(colorRegexes[0], (match, r, g, b) => {
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        });

        // Обрабатываем существующие rgba (обновляем alpha)
        result = result.replace(colorRegexes[1], (match, r, g, b) => {
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        });

        // Обрабатываем hex цвета (опционально)
        result = result.replace(colorRegexes[2], (match, hex) => {
          // Преобразуем hex в rgb
          let r, g, b;

          if (hex.length === 3) {
            // #RGB -> #RRGGBB
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
          } else {
            // #RRGGBB
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
          }

          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        });

        return result;
      },

      getListCond(type) {
        if (type === 'number' || type === 'date' || type === 'rating')
          return [
            {cond: '=', icon: 'equal', text: 'equal'},
            {cond: '!==', icon: 'not-equal-variant', text: 'not equal'},
            {cond: '>', icon: 'greater-than', text: 'greater than'},
            {cond: '<', icon: 'less-than', text: 'less than'},
            {cond: '>=', icon: 'greater-than-or-equal', text: 'greater than or equal'},
            {cond: '<=', icon: 'less-than-or-equal', text: 'less than or equal'},
          ]

        if (type === 'string')
          return [
            {cond: 'like', icon: 'equal', text: 'includes'},
            {cond: 'not like', icon: 'not-equal-variant', text: 'excludes'},
            {cond: 'is null', icon: 'code-brackets', text: 'empty'},
            {cond: 'not null', icon: 'dots-horizontal', text: 'not empty'},
            {cond: 'regex', icon: 'regex', text: 'regex'},
          ]

        if (type === 'array')
          return [
            {cond: 'in', icon: 'math-norm', text: 'includes one of'},
            {cond: 'in all', icon: 'equal', text: 'includes all'},
            {cond: 'not in', icon: 'not-equal', text: 'excludes one of'},
            {cond: 'not in all', icon: 'not-equal-variant', text: 'excludes all'},
            {cond: 'is null', icon: 'code-brackets', text: 'empty'},
            {cond: 'not null', icon: 'dots-horizontal', text: 'not empty'},
          ]

        if (type === 'boolean')
          return [
            {cond: '=', icon: 'check', text: 'yes'},
            {cond: '!=', icon: 'close', text: 'no'},
          ]

        return []
      },

      validateName(str) {
        str = str.trim().toLowerCase()
        if (str.length === 0) return 'Name is required'
        if (str.length > 50) return 'Name must be 50 characters or fewer'
        if (/[\\\/\%"?<>{}\[\]]/g.test(str))
          return 'Name must not content \\/\%\"<>{}\[\]'
        return true
      },

      transformTextToArray(str) {
        return [...new Set(str.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean))]
      },

      hexToRgba(hex, opacity) {
        hex = hex.replace('#', '')
        const num = parseInt(hex, 16)
        const r = (num >> 16) & 255
        const g = (num >> 8) & 255
        const b = num & 255
        return `rgb(${r} ${g} ${b} / ${opacity || 100}%)`
      },

      checkColorForDarkText(color) {
        if (!color) return false

        let r, g, b

        if (color.startsWith('rgb')) {
          const m = color.match(/\d+/g)
          r = +m[0]
          g = +m[1]
          b = +m[2]
        } else {
          const num = parseInt(color.slice(1), 16)
          r = (num >> 16) & 255
          g = (num >> 8) & 255
          b = num & 255
        }

        const hsp = Math.sqrt(0.299 * r * r + 0.587 * g * g + 0.114 * b * b)
        return hsp < 185
      },

      showHoverImage(event, metaId, tagId, data_type) {
        if (event.buttons !== 0) return

        let x = event.clientX
        let y = event.clientY
        const imgSize = 160
        const offset = 60

        const appHeight = window.innerHeight
        const appWidth = window.innerWidth

        if (appWidth < x + imgSize + offset) x -= imgSize + offset
        if (appHeight < y + imgSize + offset) y -= imgSize + offset

        const hover = store.hover
        hover.delay = Date.now()

        clearTimeout(hover.timeout)

        hover.timeout = setTimeout(() => {
          hover.x = x
          hover.y = y
          hover.show = true
          hover.tagId = tagId
          hover.metaId = metaId
          hover.data_type = data_type || 'meta'
        }, 500)

        setTimeout(() => {
          if (Date.now() - hover.delay > 4500) hover.show = false
        }, 5000)
      },

      hideHoverImage() {
        clearTimeout(store.hover.timeout);
        store.hover.show = false
      },

      parseFilePath(filePath, mediaId) {
        const clean = s => String(s || '').replace(/[^a-zа-яё0-9]/giu, '').toLowerCase()
        const tokenize = s => String(s || '')
          .replace(/([a-zа-яё])([A-ZА-ЯЁ])/g, '$1 $2')
          .replace(/[_\-.()[\]{}]+/g, ' ')
          .split(/\s+/)
          .map(clean)
          .filter(s => s.length > 2)

        filePath = filePath.substring(0, filePath.lastIndexOf('.'))

        const segments = filePath.split(/[\/\\]/).filter(Boolean)
        const strings = new Set(segments.map(clean).filter(s => s.length > 2))
        for (const segment of segments) {
          const tokens = tokenize(segment)
          for (let size = 1; size <= tokens.length; size++) {
            for (let x = 0; x <= tokens.length - size; x++) {
              strings.add(tokens.slice(x, x + size).join(''))
            }
          }
        }

        const tags = store.tags
        const parsed = useItemsStore().assigned.filter(i => i.meta.parser)

        const vals = []

        for (const meta of parsed) {
          const metaId = meta.metaId

          const found = tags
            .filter(tag => {
              if (tag.metaId !== metaId) return false

              for (const str of strings) {
                if (str === clean(tag.name)) return true
                if (tag.synonyms) {
                  for (const syn of tag.synonyms.split(',')) {
                    if (str === clean(syn)) return true
                  }
                }
              }
              return false
            })
            .map(i => i.id)

          for (const id of new Set(found)) {
            vals.push({tagId: id, metaId, mediaId})
          }
        }

        return vals
      },

      getAverageColor(src) {
        return new Promise(resolve => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          const img = new Image()
          img.src = src

          img.onload = () => {
            ctx.drawImage(img, 0, 0, 1, 1)
            const d = ctx.getImageData(0, 0, 1, 1).data
            resolve(`rgb(${d[0]},${d[1]},${d[2]})`)
          }
        })
      },

      getWatchedFoldersExtensions(watchedFolders) {
        const ext = {}

        watchedFolders.forEach(folder => {
          let arr = []
          folder.types.forEach(t => {
            arr = arr.concat(t.extensions.split(','))
          })
          ext[folder.path] = arr
        })

        return ext
      },

      cloneObject(obj) {
        return JSON.parse(JSON.stringify(obj))
      },
    }

    // ---- ГЛОБАЛЬНОЕ ДОСТУПНОЕ API ----

    // доступ через this.$readable
    app.config.globalProperties.$readable = readable

    // доступ через inject() если нужно
    app.provide('readable', readable)

    // АВТОДОСТУП В script setup И ЛЮБОМ JS
    // пример вызова {{ $readable.getRandomId() }}
    globalThis.$readable = readable
  },
}
