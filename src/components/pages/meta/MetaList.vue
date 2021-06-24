<template>
  <div>
    <v-btn @click="dialogAddMeta=true" class="mb-6" color="primary" block x-large rounded> <v-icon large class="mr-4">mdi-plus</v-icon> Add new meta</v-btn>

    <v-dialog v-model="dialogAddMeta" scrollable max-width="800">
      <v-card>
        <v-card-actions class="pa-4">
          <v-card @click="dialogAddComplexMeta=true, dialogAddMeta=false" hover height="100%">
            <v-toolbar color="primary" class="headline">Complex</v-toolbar>
            <v-card-text class="text-center">
              <span>Complex meta has a separate page with cards <br> 
                that can be customized in detail:<br>
                images, rating, favorite, color and etc.</span>
              <div class="mt-2">
                <v-icon size="40">mdi-card-bulleted</v-icon>
                <v-icon size="50" class="mx-1">mdi-card-account-details</v-icon>
                <v-icon size="40">mdi-card-text</v-icon>
                <v-icon size="30">mdi-card-bulleted-outline</v-icon>
              </div>
            </v-card-text>
          </v-card>
          <v-spacer/>
          <v-card @click="dialogAddSimpleMeta=true, dialogAddMeta=false" hover height="100%">
            <v-toolbar class="headline">Simple</v-toolbar>
            <v-card-text class="text-center">
              <span>Simple meta doesn't have a separate page or cards.<br> 
                They are simply displayed as a line on cards<br>
                and can be of different types:<br>
                string, number, array, date, boolean and etc.</span>
              <div class="mt-2">
                <v-icon size="40">mdi-alphabetical</v-icon>
                <v-icon size="40">mdi-numeric</v-icon>
                <v-icon size="50">mdi-calendar</v-icon>
                <v-icon size="40">mdi-code-brackets</v-icon>
                <v-icon size="30">mdi-toggle-switch</v-icon>
              </div>
            </v-card-text>
          </v-card>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-card outlined>
      <v-data-iterator :items="metaList" :items-per-page.sync="itemsPerPage" :page.sync="page" :search="search" :sort-by="sortBy" :sort-desc="sortDesc" hide-default-footer no-data-text="Please add meta first" no-results-text="No meta found">
        <template v-slot:header>
          <v-toolbar color="secondary" class="mb-4">
            <v-text-field v-model="search" dense clearable flat solo-inverted hide-details prepend-inner-icon="mdi-magnify" label="Search"></v-text-field>
            <v-spacer></v-spacer>
            <v-select v-model="sortBy" dense flat solo-inverted hide-details :items="keys" prepend-inner-icon="mdi-magnify" label="Sort by"></v-select>
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="sortDesc" dense mandatory background-color="secondary">
              <v-btn outlined :value="false"> <v-icon>mdi-arrow-up</v-icon> </v-btn>
              <v-btn outlined :value="true"> <v-icon>mdi-arrow-down</v-icon> </v-btn>
            </v-btn-toggle>
          </v-toolbar>
        </template>

        <template v-slot:default="props">
          <v-row class="px-2">
            <v-col v-for="item in props.items" :key="item.id" cols="12" sm="6" md="4" lg="3">
              <v-hover>
                <template v-slot:default="{ hover }">
                  <v-card outlined height="100%" class="meta-list-card">
                    <v-toolbar :color="item.type=='complex'?'primary':''">
                      <v-icon size="20" left>mdi-{{ item.settings.icon }}</v-icon>
                      {{ item.settings.name }} 
                    </v-toolbar>
                    <v-divider></v-divider>
                    <v-list dense class="list-zebra caption">
                      <v-list-item v-for="(key, index) in filteredKeys" :key="index" class="px-2 py-1">
                        <v-list-item-content class="py-0" :class="{'primary--text':sortBy===key}">
                          {{ key }}:
                        </v-list-item-content>
                        <v-list-item-content class="py-0 align-end" :class="{'primary--text':sortBy===key}" >
                          <span v-if="key=='date'">{{ dateAdded(item[key]) }}</span>
                          <span v-else-if="key=='edit'">{{ dateEdit(item[key]) }}</span>
                          <span v-else-if="key=='dataType'"><v-icon small left>{{ getIconDataType(item[key]) }}</v-icon>{{ item[key] }}</span>
                          <span v-else>{{ item[key] }}</span>
                        </v-list-item-content>
                      </v-list-item>
                      <div v-if="item.type==='complex'">
                        <div class="px-2 py-1 d-flex align-center justify-space-between">
                          <span class="mr-2">Assigned meta:</span>
                          <span v-if="item.metaInCard.length" class="d-flex align-center flex-wrap"> 
                            <v-icon v-for="(m, i) in item.metaInCard" :key="i" small> 
                              mdi-{{getMeta(m.id).settings.icon}} </v-icon> 
                          </span>
                          <span v-else>—</span>
                        </div>
                        <div class="px-2 py-1 d-flex align-center justify-space-between">
                          <span class="mr-2">Settings:</span>
                          <span class="d-flex align-center flex-wrap"> 
                            <v-icon v-if="item.images" small>mdi-image</v-icon>
                            <v-icon v-if="item.favorite" small>mdi-heart</v-icon>
                            <v-icon v-if="item.rating" small>mdi-star</v-icon>
                            <v-icon v-if="item.bookmark" small>mdi-bookmark</v-icon>
                            <v-icon v-if="item.synonyms" small>mdi-alphabetical-variant</v-icon>
                            <v-icon v-if="item.country" small>mdi-flag</v-icon>
                            <v-icon v-if="item.scraper" small>mdi-magnify</v-icon>
                            <v-icon v-if="item.nested" small>mdi-file-tree</v-icon>
                          </span>
                        </div>
                      </div>
                    </v-list>

                    <v-fade-transition>
                      <v-overlay v-if="hover" absolute color="secondary" z-index="1">
                        <div class="d-flex flex-column">
                          <v-btn @click="openEditMeta(item)" rounded x-small class="mb-2"> <v-icon small left>mdi-pencil</v-icon> Edit </v-btn>
                          <v-btn v-if="item.dataType==='array'" @click="setSelectedMeta(item),dialogTransferMeta=true" rounded x-small class="mb-2" color="warning"> <v-icon small left>mdi-transfer</v-icon> transfer </v-btn>
                          <v-btn @click="setSelectedMeta(item),dialogDeleteMeta=true" rounded x-small color="error"> <v-icon small left>mdi-delete</v-icon> Delete </v-btn>
                        </div>
                      </v-overlay>
                    </v-fade-transition>
                  </v-card>
                </template>
              </v-hover>
            </v-col>
          </v-row>
        </template>

        <template v-slot:footer>
          <v-toolbar color="secondary" class="mt-4" dense>
            <v-menu offset-y top open-on-hover>
              <template v-slot:activator="{ on, attrs }">
                <v-btn v-bind="attrs" v-on="on" outlined small>{{ itemsPerPage }}</v-btn>
              </template>
              <v-list dense>
                <v-list-item v-for="(number, index) in itemsPerPageArray" :key="index" @click="updateItemsPerPage(number)">
                  <v-list-item-title>{{ number }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <span class="ml-2">meta per page</span>
            <v-spacer></v-spacer>
            <v-switch v-model="detailed" label="Detailed" hide-details color="primary"/>
            <v-spacer></v-spacer>
            <span> Page {{ page }} of {{ numberOfPages }} </span>
            <v-btn small outlined class="mx-2" @click="formerPage"> <v-icon>mdi-arrow-left</v-icon> </v-btn>
            <v-btn small outlined @click="nextPage"><v-icon>mdi-arrow-right</v-icon></v-btn>
          </v-toolbar>
        </template>
      </v-data-iterator>
    </v-card>

    <DialogAddComplexMeta v-if="dialogAddComplexMeta" :dialog="dialogAddComplexMeta" @close="dialogAddComplexMeta=false"/>
    <DialogEditComplexMeta v-if="dialogEditComplexMeta" :dialogEditMeta="dialogEditComplexMeta" :metaObj="selectedMeta"  @closeSettings="dialogEditComplexMeta=false"/>
    <DialogAddSimpleMeta v-if="dialogAddSimpleMeta" :dialog="dialogAddSimpleMeta" @close="dialogAddSimpleMeta=false"/>
    <DialogEditSimpleMeta v-if="dialogEditSimpleMeta" :dialogEditMeta="dialogEditSimpleMeta" :metaObj="selectedMeta" @closeSettings="dialogEditSimpleMeta=false"/>
    <v-dialog v-if="dialogDeleteMeta" v-model="dialogDeleteMeta" persistent max-width="450">
      <v-card>
        <v-toolbar color="error">
          <v-card-title class="headline pl-0">Are you sure?</v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteMeta=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="deleteMeta" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="text-center">
          <v-icon size="72" color="error" class="py-4">mdi-alert-outline</v-icon>
          <div>Deleting the <b>{{selectedMeta.type}}</b> meta
            <v-chip small class="mx-2">
              <v-icon small left>mdi-{{selectedMeta.settings.icon}}</v-icon>
              <b>{{selectedMeta.settings.name}}</b>
            </v-chip>
            <div>will remove it from all assigned complex meta and cards.</div>
            <div v-if="selectedMeta.type=='complex'">And it will also delete all cards.</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
    <v-dialog v-if="dialogTransferMeta" v-model="dialogTransferMeta" persistent max-width="450">
      <v-card>
        <v-toolbar color="warning">
          <v-card-title class="headline pl-0">Are you sure?</v-card-title>
          <v-spacer></v-spacer>
          <v-btn @click="dialogTransferMeta=false" outlined class="mx-4"> <v-icon left>mdi-close</v-icon> No </v-btn>
          <v-btn @click="transferMeta" outlined> <v-icon left>mdi-check</v-icon> Yes </v-btn>
        </v-toolbar>
        <v-card-text class="py-8">
          <div class="text-center"> Type of meta 
            <v-chip small class="mx-2">
              <v-icon small left>mdi-{{selectedMeta.settings.icon}}</v-icon>
              <b>{{selectedMeta.settings.name}}</b>
            </v-chip>
            <div>will be changed from <b>Simple</b> to <b>Complex</b>.
              <br> A card will be created for each item in the array.</div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import MetaGetters from '@/mixins/MetaGetters'

const fs = require("fs-extra")
const path = require("path")

export default {
  name: 'MetaList',
  components: {
    DialogAddComplexMeta: () => import("@/components/pages/meta/DialogAddComplexMeta.vue"),
    DialogEditComplexMeta: () => import("@/components/pages/meta/DialogEditComplexMeta.vue"),
    DialogAddSimpleMeta: () => import("@/components/pages/meta/DialogAddSimpleMeta.vue"),
    DialogEditSimpleMeta: () => import("@/components/pages/meta/DialogEditSimpleMeta.vue"),
  },
  mixins: [MetaGetters],
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    itemsPerPageArray: [4, 8, 12, 20, 32],
    search: '',
    filter: {},
    sortDesc: false,
    page: 1,
    itemsPerPage: 8,
    sortBy: 'if',
    keys: [
      'name',
      'type',
      'dataType',
      'date',
      'edit',
      'id',
    ],
    detailed: false,
    detailedKeys: [
      'date',
      'edit',
      'id',
    ],
    // dialogs
    selectedMeta: null,
    dialogAddMeta: false,
    dialogAddComplexMeta: false,
    dialogEditComplexMeta: false,
    dialogAddSimpleMeta: false,
    dialogEditSimpleMeta: false,
    dialogDeleteMeta: false,
    dialogTransferMeta: false,
  }),
  computed: {
    numberOfPages() { return Math.ceil(this.metaList.length / this.itemsPerPage) },
    filteredKeys() { return this.keys.filter(key => {
      if (this.detailed) return key!=='name' 
      else return !this.detailedKeys.includes(key)&&key!=='name'
    } ) },
    metaList() { 
      let allMeta = this.$store.getters.meta.filter(i=>['simple','complex'].includes(i.type))
      allMeta = allMeta.map(i=>{ 
        if (i.type==='complex') return {...i, ...i.settings, ...{dataType:'cards'}}  
        else return {...i, ...i.settings} 
      })
      return allMeta.value() 
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
    nextPage() { if (this.page + 1 <= this.numberOfPages) this.page += 1 },
    formerPage() { if (this.page - 1 >= 1) this.page -= 1 },
    updateItemsPerPage(number) { this.itemsPerPage = number; if (this.numberOfPages>this.page) this.page = 1 },
    dateAdded(date) { date = new Date(date); return date.toLocaleDateString() },
    dateEdit(date) { date = new Date(date); return date.toLocaleDateString() },
    setSelectedMeta(item) { this.selectedMeta = this.$store.getters.meta.find({id:item.id}).cloneDeep().value() },
    openEditMeta(item) {
      this.setSelectedMeta(item)
      if (item.type == 'complex') this.dialogEditComplexMeta = true
      else if (item.type == 'simple') this.dialogEditSimpleMeta = true
    },
    transferMeta() {
      let meta = this.selectedMeta
      let items = meta.settings.items
      let complexMeta = {
        id: meta.id,
        date: meta.date,
        edit: Date.now(),
        type: 'complex',
        settings: { 
          name: meta.settings.name,
          nameSingular: meta.settings.name,
          hint: meta.settings.hint || '',
          icon: meta.settings.icon || 'shape',
          images: true,
          imageTypes: ['main'],
          metaInCard: [],
        },
        state: {
          visibility: {
            name: true,
          },
        },
      }
      this.$store.getters.meta.remove({id:meta.id}).write() // delete from database
      this.$store.dispatch('addComplexMeta', complexMeta)

      const metaFolder = path.join(this.pathToUserData, 'media', 'meta', meta.id)
      if (!fs.existsSync(metaFolder)) fs.mkdirSync(metaFolder)

      for (let item of items) {
        this.$store.dispatch('addMetaCard', { 
          id: item.id,
          metaId: meta.id,
          meta: { name: item.name },
        })
      }

      // change type from simple to complex in assigned complex meta
      this.$store.getters.meta.filter(i=>_.some(i.settings.metaInCard,{id:meta.id}))
        .each(i=>{ 
          let updMeta = _.find(i.settings.metaInCard, {id:meta.id})
          if (updMeta) updMeta.type = 'complex'
        }).write()
      // change type from simple to complex in assigned video cards
      if (_.find(this.$store.state.Settings.metaAssignedToVideos, {id: meta.id})) {
        let newAssignedMeta = { id: meta.id, type: 'complex' }
        let newMetaInCard = _.unionBy([newAssignedMeta], this.$store.state.Settings.metaAssignedToVideos, 'id')
        this.$store.dispatch('updateSettingsState', {key:'metaAssignedToVideos', value:_.cloneDeep(newMetaInCard)})
      }
      this.$store.getters.meta.filter({type:'complex'}).each(m=>{ // rename in filters of all meta
        for (let f of m.state.filters) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.getters.settings.get('videoFilters').each(f=>{ // rename in filters of videos
        if (f.by === meta.id) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.getters.savedFilters.each(sfType=>{ // rename in filters of saved filters
        for (let sf of sfType) for (let f of sf.filters) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.dispatch('updateSavedFilters')
      this.$store.getters.settings.get('tabs').each(tab=>{ // rename in filters of tabs
        for (let f of tab.filters) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.commit('updateSettingsState', 'tabs') // update tabs
      this.dialogTransferMeta = false
    },
    deleteMeta() {
      let meta = this.selectedMeta
      if (meta.type == 'complex') this.$store.dispatch('deleteComplexMeta', {id:meta.id, name:meta.settings.name})
      else if (meta.type == 'simple') this.$store.dispatch('deleteSimpleMeta', {id:meta.id, name:meta.settings.name})
      this.dialogDeleteMeta = false
    },
    getIconDataType(type) {
      if (type === 'string') return 'mdi-alphabetical'
      if (type === 'date') return 'mdi-calendar'
      if (type === 'number') return 'mdi-numeric'
      if (type === 'array') return 'mdi-code-array'
      if (type === 'boolean') return 'mdi-toggle-switch'
      if (type === 'cards') return 'mdi-card-bulleted'
      return 'mdi-shape'
    },
  },
}
</script>


<style lang="less">
.meta-list-card {
  .v-toolbar,
  .v-toolbar__content {
    height: auto !important;
    box-shadow: none !important;
  }
  .v-toolbar__content {
    padding: 2px 4px;
  }
  .v-list-item {
    min-height: auto;
  }
}
</style>