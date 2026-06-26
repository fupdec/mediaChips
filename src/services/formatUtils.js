export function getHoverPreviewDimensions(width, height, {maxSize = 180, defaultRatio = 16 / 9} = {}) {
  const w = Number(width) || 0
  const h = Number(height) || 0
  let ratio = defaultRatio

  if (w > 0 && h > 0) {
    ratio = w / h
  }

  ratio = Math.min(Math.max(ratio, 9 / 16), 21 / 9)

  if (ratio >= 1) {
    return {
      previewWidth: maxSize,
      previewHeight: Math.round(maxSize / ratio),
    }
  }

  return {
    previewWidth: Math.round(maxSize * ratio),
    previewHeight: maxSize,
  }
}

export function getRandomId() {
  return Math.random().toString(16).slice(2)
}

export function getFilterObject(obj) {
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
}

export function getReadableFileSize(bytes, isObject = false) {
  const result = {number: bytes, text: ''}

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
}

export function getReadableDuration(duration) {
  let sec = Math.floor(duration)
  let h = (sec / 3600) ^ 0
  let m = ((sec - h * 3600) / 60) ^ 0
  let s = sec - h * 3600 - m * 60

  h = h > 0 ? (h < 10 ? '0' + h + ':' : h + ':') : ''
  m = m < 10 ? '0' + m : m
  s = s < 10 ? '0' + s : s

  return h + m + ':' + s
}

export function getReadableBitrate(value) {
  if (value > 1_000_000) return (value / 1024 / 1024 - 0.01).toFixed(0) + ' Mbps'
  if (value > 1000) return (value / 1024 - 0.01).toFixed(0) + ' Kbps'
  return value + ' bps'
}

export function getReadableVideoQuality(width, height) {
  if (width > height) {
    if (height < 720) return 'SD'
    if (height < 1080) return 'HD'
    if (height < 1800) return 'FHD'
    return 'UHD'
  }
  return 'Vert'
}

export function getReadableVideoHeight(width, height) {
  return height > 1800 && width > height ? '4K' : height + 'p'
}

export function getFileNameFromPath(fullPath) {
  return fullPath.split('\\').pop().split('/').pop().replace(/\.[^/.]+$/, '')
}

export function getFileExtensionFromPath(fullPath) {
  return fullPath.split('.').pop().toLowerCase()
}

export function getDateFromMs(ms) {
  const date = new Date(ms)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

export function getDateForDB(ms) {
  const date = ms ? new Date(ms) : new Date()
  return date.toISOString().replace('T', ' ').replace('Z', ' +00:00')
}

export function foundByChars(text, query) {
  text = text.toLowerCase()
  let foundCharIndex = 0

  for (let i = 0; i < query.length; i++) {
    const char = query[i]
    const x = text.indexOf(char, foundCharIndex)
    if (x === -1) return false
    foundCharIndex = x + 1
  }
  return true
}

export function highlightChars(string, query, is_default) {
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
}

export function checkColorForDarkText(color) {
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
}

export function getTextColor(color, is_outlined) {
  if (!color) return ''
  if (is_outlined) {
    return color
  }

  return checkColorForDarkText(color) ? 'white' : 'black'
}

export function addTransparencyToGradient(gradientString, alpha = 0.75) {
  const colorRegexes = [
    /rgb\((\d+),\s*(\d+),\s*(\d+)\)/g,
    /rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/g,
    /#([0-9a-f]{6}|[0-9a-f]{3})(?=\s|\)|,)/gi,
  ]

  let result = gradientString

  result = result.replace(colorRegexes[0], (match, r, g, b) => {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  })

  result = result.replace(colorRegexes[1], (match, r, g, b) => {
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  })

  result = result.replace(colorRegexes[2], (match, hex) => {
    let r, g, b

    if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16)
      g = parseInt(hex[1] + hex[1], 16)
      b = parseInt(hex[2] + hex[2], 16)
    } else {
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    }

    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  })

  return result
}

export function getListCond(type) {
  if (type === 'number' || type === 'date' || type === 'rating') {
    return [
      {cond: '=', icon: 'equal', text: 'equal'},
      {cond: '!==', icon: 'not-equal-variant', text: 'not equal'},
      {cond: '>', icon: 'greater-than', text: 'greater than'},
      {cond: '<', icon: 'less-than', text: 'less than'},
      {cond: '>=', icon: 'greater-than-or-equal', text: 'greater than or equal'},
      {cond: '<=', icon: 'less-than-or-equal', text: 'less than or equal'},
    ]
  }

  if (type === 'string') {
    return [
      {cond: 'like', icon: 'equal', text: 'includes'},
      {cond: 'not like', icon: 'not-equal-variant', text: 'excludes'},
      {cond: 'is null', icon: 'code-brackets', text: 'empty'},
      {cond: 'not null', icon: 'dots-horizontal', text: 'not empty'},
      {cond: 'regex', icon: 'regex', text: 'regex'},
    ]
  }

  if (type === 'array') {
    return [
      {cond: 'in', icon: 'math-norm', text: 'includes one of'},
      {cond: 'in all', icon: 'equal', text: 'includes all'},
      {cond: 'not in', icon: 'not-equal', text: 'excludes one of'},
      {cond: 'not in all', icon: 'not-equal-variant', text: 'excludes all'},
      {cond: 'is null', icon: 'code-brackets', text: 'empty'},
      {cond: 'not null', icon: 'dots-horizontal', text: 'not empty'},
    ]
  }

  if (type === 'boolean') {
    return [
      {cond: '=', icon: 'check', text: 'yes'},
      {cond: '!=', icon: 'close', text: 'no'},
    ]
  }

  return []
}

export function validateName(str) {
  str = str.trim().toLowerCase()
  if (str.length === 0) return 'Name is required'
  if (str.length > 50) return 'Name must be 50 characters or fewer'
  if (/[\\\/\%"?<>{}\[\]]/g.test(str)) {
    return 'Name must not content \\/\\%\"<>{}\[\]'
  }
  return true
}

export function transformTextToArray(str) {
  return [...new Set(str.trim().split(/\r?\n/).map(s => s.trim()).filter(Boolean))]
}

export function hexToRgba(hex, opacity) {
  hex = hex.replace('#', '')
  const num = parseInt(hex, 16)
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgb(${r} ${g} ${b} / ${opacity || 100}%)`
}

export function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj))
}
