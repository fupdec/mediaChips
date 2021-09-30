<script>
import Functions from '@/mixins/Functions'

export default {
  mixins: [Functions],
  methods: {
    getConditions(type) {
      if (type === 'number' || type === 'date') return ['equal', 'not equal', 'greater than', 'less than', 'greater than or equal', 'less than or equal', 'empty', 'not empty']
      if (type === 'string') return ['includes', 'excludes', 'empty', 'not empty']
      if (type === 'array' || type === 'select') return ['includes one of', 'includes all', 'excludes', 'empty', 'not empty']
      if (type === 'boolean') return ['yes', 'no']
      return []
    },
    getIconCond(cond) {
      if (cond === 'equal') return 'mdi-equal'
      if (cond === 'not equal') return 'mdi-not-equal-variant'
      if (cond === 'greater than') return 'mdi-greater-than'
      if (cond === 'less than') return 'mdi-less-than'
      if (cond === 'greater than or equal') return 'mdi-greater-than-or-equal'
      if (cond === 'less than or equal') return 'mdi-less-than-or-equal'
      if (cond === 'includes all' || cond === 'includes') return 'mdi-equal'
      if (cond === 'includes one of') return 'mdi-math-norm'
      if (cond === 'excludes') return 'mdi-not-equal-variant'
      if (cond === 'yes') return 'mdi-check'
      if (cond === 'no') return 'mdi-close'
      if (cond === 'empty') return 'mdi-code-brackets'
      if (cond === 'not empty') return 'mdi-dots-horizontal'
      return 'mdi-help'
    },
    getItems(id) { return this.getMeta(id).settings.items || [] },
    getHint(id) { 
      let meta = this.getMeta(id)
      if (meta) return this.getMeta(id).settings.hint || '' 
      else return ''
    },
    getHintNumber(id, val) {
      if (id==='size') return this.calcSize(val)
      else if (id==='duration') return this.calcDur(val)
      else return this.getHint(id)
    },
    addFilter() {
      this.filters.push({
        by: null,
        cond: null,
        val: null,
        type: null,
        flag: null,
        lock: false,
      })
    },
    duplicateFilter(i) {
      let newFilter = _.cloneDeep(this.filters[i])
      newFilter.lock = false
      this.filters.push(newFilter)
    },
    removeFilter(i) { this.filters.splice(i, 1) },
    removeAll() { this.filters = _.filter(this.filters, {lock: true}) },
    setBy(e, i) {
      this.filters[i].by = e
      if (!e) {
        this.filters[i].cond = null
        this.filters[i].val = null
        this.filters[i].type = null
        this.filters[i].flag = null
        this.filters[i].lock = false
        return
      } else if (this.metaType.number.includes(e)) {
        this.filters[i].type = 'number'
        this.filters[i].val = 0
      } else if (this.metaType.string.includes(e)) {
        this.filters[i].type = 'string'
        this.filters[i].val = ''
      } else if (this.metaType.array.includes(e)) {
        this.filters[i].type = 'array'
        this.filters[i].val = []
      } else if (this.metaType.date.includes(e)) {
        this.filters[i].type = 'date'
        this.filters[i].val = ''
      } else if (this.metaType.boolean.includes(e)) {
        this.filters[i].type = 'boolean'
        this.filters[i].val = ''
        if (e == 'favorite') this.filters[i].appbar = true
      } else if (this.metaType.select.includes(e)) {
        this.filters[i].type = 'select'
        this.filters[i].val = []
      }
      this.filters[i].cond = this.getConditions(this.filters[i].type)[0]
    },
    setCond(e, i) { this.filters[i].cond = e },
    setVal(e, i) { 
      this.filters[i].val = e 
      let metaId = this.filters[i].by
      let meta = this.getMeta(metaId)
      if (meta && meta.type === 'complex') {
        this.$refs[metaId][0].lazySearch = null
      }
    },
    setFlag(e, i) { this.filters[i].flag = e },
    removeChip(item, i) { 
      const index = this.filters[i].val.indexOf(item.name)
      if (index > -1) this.filters[i].val.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    removeItem(item, i) { 
      const index = this.filters[i].val.indexOf(item)
      if (index > -1) this.filters[i].val.splice(index, 1)
      this.$store.state.hoveredImage = false
    },
    filterCards(cardObject, queryText, itemText) {
      let card = _.cloneDeep(cardObject)
      let query = queryText.toLowerCase()

      function foundByChars(text, query) {
        text = text.toLowerCase()
        let foundCharIndex = 0
        let foundAllChars = false
        for (let i = 0; i < query.length; i++) {
          const char = query.charAt(i)
          const index = text.indexOf(char, foundCharIndex)
          if (index > -1) foundAllChars = true, foundCharIndex = index + 1
          else return false
        }
        return foundAllChars
      }

      let filtersDefault = this.$store.state.Settings.typingFiltersDefault 

      if (filtersDefault) {
        let index = card.meta.name.toLowerCase().indexOf(query)
        if (index > -1) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            let indexSub = card.meta.synonyms[i].toLowerCase().indexOf(query)
            if (indexSub > -1) return true
          }
          return false
        }
      } else {
        if (foundByChars(card.meta.name, query)) return true
        else {
          if (!card.meta.synonyms) return false
          for (let i=0; i<card.meta.synonyms.length; i++) {
            return foundByChars(card.meta.synonyms[i], query)
          }
          return false
        }
      }
    },
    filterBy(metaObj, queryText, itemText) {
      let meta = this.getMeta(metaObj.by).settings.name.toLowerCase()
      let query = queryText.toLowerCase()
      if (meta) return meta.includes(query)
      else false
    },
    loadFilters(filters) { this.filters = filters },
  },
}
</script>