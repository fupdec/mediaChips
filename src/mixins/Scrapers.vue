<script>
export default {
  computed: {
  },
  data: () => ({
  }),
  methods: {
    findPerformersFreeonce() {
      this.searchInProgress = true
      this.showFindError = false
      this.resultFromFreeones = true
      axios.get(`https://www.freeones.ru/babes?q=${this.queryString}&s=rank.currentRank&o=asc&l=96&p=1`)
      .then((response)=>{
        if(response.status === 200) {
          this.searchInProgress = false
          this.foundPerformers = []
          // console.log('result')
          const html = response.data;
          const $ = cheerio.load(html)
          $('.grid-item').each((i,e) => {
            let p = {}
            p.img = $(e).find('.image-content').attr('src')
            if (p.img == undefined) {
              p.img = $(e).find('.image-content').attr('data-src')
            }
            if (p.img == undefined) {
              p.img = path.join(this.pathToUserData, '/img/templates/performer.png')
            }
            p.name = $(e).find('[data-test="subject-name"]').text().trim()
            p.link = p.name.replace(' ', '-').toLowerCase()
            p.country = $(e).find('.flag-icon').attr('title').trim()
            // console.log(p)
            this.foundPerformers.push(p)
          })
          // console.log(this.foundPerformers)
          if (this.foundPerformers.length==0) {
            this.showFindError = true
          } else {
            this.showFindError = false
          }
        }
      }, (error) => {
        this.searchInProgress = false
        this.showFindError = true
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.queryString}`
        })
      })
    },
    findPerformersIafd() {
      this.showFindError = false
      this.searchInProgress = true
      this.resultFromFreeones = false
      let url = 'http://www.iafd.com/results.asp?searchtype=comprehensive&searchstring='
      axios.get(url + this.queryString).then((response)=>{
        if(response.status === 200) {
          this.searchInProgress = false
          this.foundPerformers = []
          const html = response.data;
          const $ = cheerio.load(html)
          $('#tblFem tbody tr').each((i,e) => {
            if (i > 100) { return false }
            let p = {}
            p.link = $(e).find('td:nth-child(2) a').attr('href')
            p.img = $(e).find('img').attr('src')
            p.name = $(e).find('td:nth-child(2) a').text().trim()
            p.aliases = $(e).find('td:nth-child(3)').text().trim()
            p.country = ''
            this.foundPerformers.push(p)
          })
          if (this.foundPerformers.length==0) {
            this.showFindError = true
          } else {
            this.showFindError = false
          }
        }
      }, (error) => {
        this.searchInProgress = false
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.queryString}`
        })
      })
    },
    getPerformerInfoFreeonce(performer) {
      this.searchInProgress = true
      this.foundPerformers = []
      axios.get(`https://www.freeones.com/${performer}/bio`).then((response)=>{
        if (response.status === 200) {
          this.searchInProgress = false
          this.clearPreviouslyFound()

          const html = response.data;
          const $ = cheerio.load(html)
          let profile = {}

          profile.aliases = $('[data-test="p_aliases"]').text().trim()
          let yearsActive = []
          $('.timeline-horizontal .m-0').each((i, elem)=>{
            yearsActive[i] = $(elem).text().trim()
          }) 
          if (yearsActive[0]) {
            if (!yearsActive[0].match(/\D*/)[0]) profile.start = yearsActive[0] // if not contains words
          }
          if (yearsActive[1]) {
            if (!yearsActive[1].match(/\D*/)[0]) profile.end = yearsActive[1] // if not contains words like "Now"
          }
          let countries = this.countries.map(c=>c.name)
          if ( countries.includes($('[data-test="link-country"] span').text().trim()) ) {
            profile.nations = [$('[data-test="link-country"] span').text().trim()]
          }
          profile.birth = $('[href*="dateOfBirth"]').attr('href')
          if (profile.birth) {
            let date = profile.birth.match(/\d{4}-\d{2}-\d{2}/)
            if (date) profile.birth = date[0]
            else profile.birth = undefined
          }
          let ethnicity = $('[data-test="link_span_ethnicity"]').text().trim()
          if (ethnicity) {
            profile.ethnicity = []
            ethnicity = ethnicity.split(',')
            let performerInfoEthnicity = this.$store.getters.settings.get('performerInfoEthnicity').value()
            for (let i=0; i<ethnicity.length; i++) {
              if ( performerInfoEthnicity.includes(ethnicity[i]) ) {
                profile.ethnicity.push(ethnicity[i])
              }
            }
          }
          let eyes = $('[data-test="link_span_eye_color"]').text().trim()
          if (eyes) {
            profile.eyes = []
            eyes = eyes.split(',')
            let performerInfoEyes = this.$store.getters.settings.get('performerInfoEyes').value()
            for (let i=0; i<eyes.length; i++) {
              if ( performerInfoEyes.includes(eyes[i]) ) {
                profile.eyes.push(eyes[i])
              }
            }
          }
          let hair = $('[data-test="link_span_hair_color"]').text().trim()
          if (hair) {
            profile.hair = []
            hair = hair.split(',')
            let performerInfoHair = this.$store.getters.settings.get('performerInfoHair').value()
            for (let i=0; i<hair.length; i++) {
              if ( performerInfoHair.includes(hair[i]) ) {
                profile.hair.push(hair[i])
              }
            }
          }
          profile.height = $('[data-test="link_span_height"]').text().trim()
          if(profile.height) {
            profile.height = profile.height.match(/\d{3}/)[0]
          }
          profile.weight = $('[data-test="link_span_weight"]').text().trim()
          if(profile.weight) {
            profile.weight = profile.weight.match(/\d{2}/)[0]
          }
          let sizes = []
          $('[data-test="p-measurements"] span').each((i, elem)=>{
            sizes[i] = $(elem).text().trim()
          }) 
          if (sizes.length>0) {
            if (sizes[0].match(/\D{1,}/)) {
              profile.cups = [ sizes[0].match(/\D{1,}/)[0] ]
            }
            sizes[0] = sizes[0].match(/\d{2}/)[0]
          }
          profile.bra = sizes[0]
          profile.waist = sizes[1]
          profile.hip = sizes[2]
          profile.boobs = $('[data-test="link_span_boobs"]').text().trim()
          profile.profession = $('.sidebar-right .heading').next().find('.text-center')[0].children[0].data
          if (profile.aliases != undefined) { this.transfer.found.aliases = profile.aliases }
          if (profile.start != undefined) { this.transfer.found.start = profile.start }
          if (profile.end != undefined) { this.transfer.found.end = profile.end }
          if (profile.profession != undefined) { 
            if (profile.profession.includes('Adult')) {
              profile.profession = 'Erotic model'
            }
            if (profile.profession.includes('Porn')) {
              profile.profession = 'Pornstar'
            }
            if (this.$store.getters.settings.get('performerInfoCategory').value().includes(profile.profession)) {
              this.transfer.found.category = [profile.profession]
            } else profile.profession = undefined
          }
          if (profile.nations != undefined) { this.transfer.found.nations = profile.nations }
          if (profile.birth != undefined) { this.transfer.found.birthday = profile.birth }
          if (profile.ethnicity != undefined) { this.transfer.found.ethnicity = profile.ethnicity }
          if (profile.hair != undefined) { this.transfer.found.hair = profile.hair }
          if (profile.eyes != undefined) { this.transfer.found.eyes = profile.eyes }
          if (profile.height != undefined) { this.transfer.found.height = profile.height }
          if (profile.weight != undefined) { this.transfer.found.weight = profile.weight }
          if (profile.bra != undefined) { this.transfer.found.bra = profile.bra }
          if (profile.waist != undefined) { this.transfer.found.waist = profile.waist }
          if (profile.hip != undefined) { this.transfer.found.hip = profile.hip }
          if (profile.boobs != undefined) { 
            if (profile.boobs === "Natural") {
              profile.boobs = "Real"
            }
            this.transfer.found.boobs = [profile.boobs]
          }
          if (profile.cups != undefined) { this.transfer.found.cups = profile.cups }
        }
        this.getTransferCurrent()
        this.dialogTransferInfo = true
        this.closeDialog()
      }, (error) => {
        console.log(error)
        this.searchInProgress = false
        this.closeDialog()
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.queryString}`
        })
      })
    },
    getPerformerInfoIafd(performer) {
      this.searchInProgress = true
      this.foundPerformers = []
      axios.get(`http://www.iafd.com${performer}`).then((response) => {
        if(response.status === 200) {
          this.searchInProgress = false
          this.clearPreviouslyFound()

          const html = response.data;
          const $ = cheerio.load(html)
          let bio = []
          $('.bioheading').each((i,heading) => {
            bio.push({
              heading: $(heading).text().trim(),
              biodata: $('.bioheading + .biodata').eq(i).text().trim()
            })
          })
          if (this.getBioString('performer', bio)) {
            this.transfer.found.aliases = this.getBioString('performer', bio)
          }
          if (this.getBioString('ethnicity', bio)) {
            let ethnicity = this.getBioString('ethnicity', bio).split(',')
            let foundEth = []
            let performerInfoEthnicity = this.$store.getters.settings.get('performerInfoEthnicity').value()
            for (let i=0; i<ethnicity.length; i++) {
              if ( performerInfoEthnicity.includes(ethnicity[i]) ) {
                foundEth.push(ethnicity[i])
              }
            }
            if (foundEth.length) {
              this.transfer.found.ethnicity = foundEth
            }
          }
          if (this.getBioString('hair', bio)) {
            let hair = this.getBioString('hair', bio).split(',')
            let foundHair = []
            let performerInfoHair = this.$store.getters.settings.get('performerInfoHair').value()
            for (let i=0; i<hair.length; i++) {
              if ( performerInfoHair.includes(hair[i]) ) {
                foundHair.push(hair[i])
              }
            }
            if (foundHair.length) {
              this.transfer.found.hair = foundHair
            }
          }
          let years
          if (this.getBioString('years', bio)) {
            years = this.getBioString('years', bio)
            this.transfer.found.start = years.match(/\d{4}/)[0]  
            if ( years.match(/\d{4}/)[1] != undefined ) {
              this.transfer.found.end = years.match(/\d{4}/)[1]
            }
          }
          if (this.getBioString('birthday', bio)) {
            let year = this.getBioString('birthday', bio).match(/\d{4}/)[0]
            let day = this.getBioString('birthday', bio).match(/\d{2}/)[0]
            let month = this.getBioString('birthday', bio).split(' ')[0]
            month = this.months.indexOf(month.toLowerCase())+1
            if (+month < 10) month = "0"+month.toString()
            this.transfer.found.birthday = `${year}-${month}-${day}`
          }
          if (this.getBioString('height', bio)) {
            this.transfer.found.height = this.getBioString('height', bio).match(/\d{3}/)[0]
          }
          if (this.getBioString('weight', bio)) {
            this.transfer.found.weight = this.getBioString('weight', bio).match(/\d{2}/g)[1]
          }
          if (this.getBioString('measurements', bio)) {
            let sizes = this.getBioString('measurements', bio).match(/\d{2}/g)
            let cups = this.getBioString('measurements', bio).split('-')[0]
            this.transfer.found.cups = [ cups.match(/\D{1,}/)[0] ]
            this.transfer.found.bra = sizes[0]
            this.transfer.found.waist = sizes[1]
            this.transfer.found.hip = sizes[2]
          }
          if (this.getBioString('birthplace', bio)) {
            let countries = this.countries.map(c=>c.name)
            if (countries.includes(this.getBioString('birthplace', bio))) {
              this.transfer.found.nations = [this.getBioString('birthplace', bio)]
            }
            if (this.getBioString('nationality', bio).toLowerCase().includes('america')) {
              this.transfer.found.nations = ['United States']
            }
          }
          this.transfer.found.category = ['Pornstar']
            
          this.getTransferCurrent()
          this.dialogTransferInfo = true
          this.closeDialog()
        }
      }, (error) => {
        this.searchInProgress = false
        this.closeDialog()
        console.log(error)
        this.$store.dispatch('setNotification', {
          type: 'error',
          text: `Can't find info for ${this.queryString}`
        })
      })
    },
    getBioString(string, bio) {
      let val = _.filter(bio, (param) => (
        param.heading.toLowerCase().includes(string)
      ))[0].biodata
      if (val != 'No known aliases' && val != 'No data') {
        return val 
      } else return false
    },
  },
}
</script>