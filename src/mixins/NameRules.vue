<script>
export default {
  data: () => ({
    reserved: ['id','name','duration','size','resolution','rating','favorite','bookmark',
      'date','edit','views','array','type','number','string','boolean'],
  }),
  methods: {
    nameRules(string) {
      string = string.trim().toLowerCase()
      if (string.length > 50) return 'Name must be less than 50 characters'
      else if (string.length===0) return 'Name is required'
      else if (this.reserved.includes(string)) return 'This word is reserved'
      else return true
    },
  },
}
</script>