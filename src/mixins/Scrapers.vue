<script>
const fs = require('fs')
const path = require("path")
const axios = require("axios")
const cheerio = require("cheerio")

import jimp from 'jimp'
import Countries from '@/components/elements/Countries'

export default {
  computed: {
  },
  data: () => ({
    months: ['january','february','march','april','may','june','july','august','september','october','november','december'],
  }),
  computed: {
    pathToUserData() { return this.$store.getters.getPathToUserData }
  },
  methods: {
    findMeta(scraper) {
      this.searchInProgress = true
      this.showFindError = false
      this.resultFromFreeones = scraper == 'freeonce'
      let query = ''
      if (scraper == 'freeonce') query = `https://www.freeones.ru/babes?q=${this.queryString}&s=rank.currentRank&o=asc&l=96&p=1`
      if (scraper == 'iafd') query = 'http://www.iafd.com/results.asp?searchtype=comprehensive&searchstring=' + this.queryString
      axios.get(query).then((response) => {
        if (response.status !== 200) return
        this.searchInProgress = false
        this.found = []
        const html = response.data
        const $ = cheerio.load(html)
        if (scraper == 'freeonce') this.freeonce($)
        if (scraper == 'iafd') this.iafd($)
        this.showFindError = this.found.length==0
      }, (error) => {
        this.searchInProgress = false
        this.showFindError = true
        this.$store.dispatch('setNotification', {type: 'error',text: `Can't find info for ${this.queryString}`})
      })
    },
    freeonce($) {
      $('.grid-item').each((i,e) => {
        let p = {}
        p.img = $(e).find('.image-content').attr('src')
        if (p.img == undefined) p.img = $(e).find('.image-content').attr('data-src')
        if (p.img == undefined) p.img = path.join(__static, '/img/default.png') // replace with logo image
        p.name = $(e).find('[data-test="subject-name"]').text().trim()
        p.link = p.name.replace(' ', '-').toLowerCase()
        let flag =  $(e).find('.flag-icon').attr('title') || ''
        if (flag) p.country = flag.trim()
        this.found.push(p)
      })
    },
    iafd($) {
      $('#tblFem tbody tr').each((i,e) => {
        if (i > 100) return false
        let p = {}
        p.link = $(e).find('td:nth-child(2) a').attr('href')
        p.img = $(e).find('img').attr('src')
        p.name = $(e).find('td:nth-child(2) a').text().trim()
        p.synonyms = $(e).find('td:nth-child(3)').text().trim()
        p.country = ''
        this.found.push(p)
      })
    },
    getInfo(meta, scraper, name) {
      this.searchInProgress = true
      let query = ''
      if (scraper == 'freeonce') query = `https://www.freeones.com/${meta}/bio`
      if (scraper == 'iafd') query = `http://www.iafd.com${meta}`
      axios.get(query).then((response) => {
        if (response.status !== 200) return
        this.searchInProgress = false
        this.transfer.current = {}
        this.transfer.found = {}
        const html = response.data
        const $ = cheerio.load(html)
        if (scraper == 'freeonce') this.freeonesMeta($, this.$store.state.Meta.selectedMeta[0])
        if (scraper == 'iafd') this.iafdMeta($, name)
        this.initCurrentValues()
        this.dialogTransferInfo = true
      }, (error) => {
        this.searchInProgress = false
        this.$store.dispatch('setNotification', {type:'error', text:`Can't find info for "${this.queryString}"`})
      })
    },
    freeonesMeta($, metaCardId) {
      return new Promise(resolve => {
      let imgSrc = $('.dashboard-image-large img')
      if (imgSrc.length) {
        const imgPath = path.join(this.pathToUserData,'/media/',`meta/${this.meta.id}/`,`${metaCardId}_main.jpg`)
        let imgUrl = imgSrc[0].attribs.src
        if (!fs.existsSync(imgPath)) {
          axios.get(imgUrl, {responseType: 'arraybuffer'}).then(response => {
            const buffer = Buffer.from(response.data, 'binary')
            jimp.read(buffer)
              .then(image => image.quality(85).write(imgPath))
              .catch(err => { console.error(err) })
          })
        }
      }
      let found = {}
      found.name = $('.dashboard-image-container img').attr('title') || this.getCard(metaCardId).meta.name
      found.synonyms = $('[data-test="link-country"]').text().trim()
      found.synonyms = $('[data-test="p_aliases"]').text().trim()
      let yearsActive = []
      $('.timeline-horizontal .m-0').each((i,elem)=>{yearsActive[i] = $(elem).text().trim()}) 
      if (yearsActive[0]) if (!yearsActive[0].match(/\D*/)[0]) found.career_start = +yearsActive[0] // if not contains words
      if (yearsActive[1]) if (!yearsActive[1].match(/\D*/)[0]) found.career_end = +yearsActive[1] // if not contains words like "Now"
      let countries = Countries.map(c=>c.name)
      if ( countries.includes($('[data-test="link-country"] span').text().trim()) )
        found.country = [$('[data-test="link-country"] span').text().trim()]
      found.birthday = $('[href*="dateOfBirth"]').attr('href')
      if (found.birthday) {
        let date = found.birthday.match(/\d{4}-\d{2}-\d{2}/)
        if (date) found.birthday = date[0]
        else found.birthday = undefined
      }
      let ethnicity = $('[data-test="link_span_ethnicity"]').text().trim()
      if (ethnicity) found.ethnicity = ethnicity.split(',')
      let eyes = $('[data-test="link_span_eye_color"]').text().trim()
      if (eyes) found.eyes = eyes.split(',')
      let hair = $('[data-test="link_span_hair_color"]').text().trim()
      if (hair) found.hair = hair.split(',')
      found.height = $('[data-test="link_span_height"]').text().trim()
      if (found.height) {
        found.height = found.height.match(/\d{3}/)
        if (found.height) found.height = found.height[0]
        else found.height = undefined
      }
      found.weight = $('[data-test="link_span_weight"]').text().trim() 
      if (found.weight) {
        found.weight = found.weight.match(/\d{2}/)
        if (found.weight) found.weight = found.weight[0]
        else found.weight = undefined
      }
      let sizes = []
      $('[data-test="p-measurements"] span').each((i,elem)=>{sizes[i] = $(elem).text().trim()}) 
      if (sizes.length > 0) {
        if (sizes[0].match(/\D{1,}/)) found.cups = [ sizes[0].match(/\D{1,}/)[0] ]
        sizes[0] = sizes[0].match(/\d{2}/)[0]
      }
      found.bra = sizes[0]
      found.waist = sizes[1]
      found.hip = sizes[2]
      found.boobs = $('[data-test="link_span_boobs"]').text().trim()
      if (found.boobs !== undefined) {
        if (found.boobs === "Natural") found.boobs = ["Real"]
        else if (found.boobs === "Unknown") delete found.boobs
        else found.boobs = [found.boobs]
      }
      found.category = $('[data-test="link_span_profession"]').map((i,e)=>$(e).text().trim()).toArray()
      for (const i in found) if (found[i] === undefined) delete found[i]
      this.transfer.found = _.cloneDeep(found)
      resolve()
      })
    },
    iafdMeta($) {
      function getBioString(string, bio) {
        let val = _.filter(bio, i=>i.heading.toLowerCase().includes(string))[0].biodata
        if (val!=='No known aliases' && val!=='No data') return val
        else return false
      }
      let bio = []
      $('.bioheading').each((i,heading) => {
        bio.push({
          heading: $(heading).text().trim(),
          biodata: $('.bioheading + .biodata').eq(i).text().trim()
        })
      })
      if (getBioString('performer', bio)) this.transfer.found.synonyms = getBioString('performer', bio)
      if (getBioString('ethnicity', bio)) this.transfer.found.ethnicity = getBioString('ethnicity', bio).split(',')
      if (getBioString('hair', bio)) this.transfer.found.hair = getBioString('hair', bio).split(/[.,\/]/)
      let years
      if (getBioString('years', bio)) {
        years = getBioString('years', bio)
        this.transfer.found.career_start = years.match(/\d{4}/)[0]  
        if ( years.match(/\d{4}/)[1] !== undefined ) this.transfer.found.career_end = years.match(/\d{4}/)[1]
      }
      if (getBioString('birthday', bio)) {
        let year = getBioString('birthday', bio).match(/\d{4}/)[0]
        let day = getBioString('birthday', bio).match(/\d{2}/)[0]
        let month = getBioString('birthday', bio).split(' ')[0]
        month = this.months.indexOf(month.toLowerCase())+1
        if (+month < 10) month = "0"+month.toString()
        this.transfer.found.birthday = `${year}-${month}-${day}`
      }
      if (getBioString('height', bio)) this.transfer.found.height = getBioString('height', bio).match(/\d{3}/)[0]
      if (getBioString('weight', bio)) this.transfer.found.weight = getBioString('weight', bio).match(/\d{2}/g)[1]
      if (getBioString('measurements', bio)) {
        let sizes = getBioString('measurements', bio).match(/\d{2}/g)
        let cups = getBioString('measurements', bio).split('-')[0]
        this.transfer.found.cups = [ cups.match(/\D{1,}/)[0] ]
        this.transfer.found.bra = sizes[0]
        this.transfer.found.waist = sizes[1]
        this.transfer.found.hip = sizes[2]
      }
      if (getBioString('birthplace', bio)) {
        let countries = Countries.map(c=>c.name)
        if (countries.includes(getBioString('birthplace', bio))) {
          this.transfer.found.country = [getBioString('birthplace', bio)]
        }
        if (getBioString('nationality', bio).toLowerCase().includes('america')) {
          this.transfer.found.country = ['United States']
        }
      }
      for (const i in this.transfer.found) if (this.transfer.found[i] === undefined) delete this.transfer.found[i]
      this.transfer.found.category = ['Porn Stars']
    },
  },
}
</script>