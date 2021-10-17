<template>
  <div>
    <v-card flat max-width="800" style="margin: auto;" class="pt-10">
      <v-btn @click="dialogAddMeta=true" class="mb-6" color="primary" block x-large rounded> <v-icon large class="mr-4">mdi-plus</v-icon> Add new meta</v-btn>
    </v-card>

    <v-container fluid class="mb-6">
      <v-row>
        <v-col cols="12" lg="6">
          <v-card outlined>
            <v-data-iterator :items="complexMetaList" :search="searchCM" :sort-by="sortByCM" :sort-desc="sortDescCM" :items-per-page="12"
              :footer-props="{'items-per-page-options':[12,24,36,48,60]}" no-data-text="Please add complex meta first" no-results-text="No meta found">
              <template v-slot:header>
                <div class="headline text-center py-2">List of complex meta</div>
                <v-toolbar class="mb-4" color="primary" elevation="0" dense>
                  <v-text-field v-model="searchCM" dense clearable flat solo outlined hide-details prepend-inner-icon="mdi-magnify" label="Search"></v-text-field>
                  <v-spacer class="mx-2"/>
                  <v-select v-model="sortByCM" dense flat solo outlined hide-details :items="['name','date','edit']" prepend-inner-icon="mdi-sort" label="Sort by"></v-select>
                  <v-spacer class="mx-2"/>
                  <v-btn-toggle v-model="sortDescCM" dense mandatory>
                    <v-btn outlined :value="false"> <v-icon>mdi-arrow-up</v-icon> </v-btn>
                    <v-btn outlined :value="true"> <v-icon>mdi-arrow-down</v-icon> </v-btn>
                  </v-btn-toggle>
                </v-toolbar>
              </template>

              <template v-slot:default="props">
                <v-row class="px-4">
                  <v-col v-for="item in props.items" :key="item.id" cols="12" sm="4" md="3" lg="4">
                    <v-hover>
                      <template v-slot:default="{ hover }">
                        <v-card outlined height="100%" class="meta-list-card">
                          <v-toolbar color="primary">
                            <v-icon size="20" left>mdi-{{ item.settings.icon }}</v-icon>
                            {{ item.settings.name }} 
                          </v-toolbar>
                          <v-chip-group column class="px-2">
                            <span class="mr-2 caption">Assigned meta:</span>
                            <v-chip v-for="(m, i) in item.settings.metaInCard" :key="m.id+i" x-small class="px-1">
                              <v-icon x-small> mdi-{{getMeta(m.id).settings.icon}} </v-icon> {{getMeta(m.id).settings.name}}
                            </v-chip>
                          </v-chip-group>
                          <v-chip-group column class="px-2">
                            <span class="mr-2 caption">Settings:</span>
                            <v-chip v-for="(attr, i) in item.attrs" :key="attr.name+i" x-small class="px-1">
                              <v-icon x-small> mdi-{{attr.icon}} </v-icon> {{attr.name}}
                            </v-chip>
                          </v-chip-group>

                          <v-fade-transition>
                            <v-overlay v-if="hover" absolute color="primary" z-index="1">
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
                <v-divider class="mt-4"></v-divider>
              </template>
            </v-data-iterator>
          </v-card>
        </v-col>

        <v-col cols="12" lg="6">
          <v-card outlined>
            <v-data-iterator :items="simpleMetaList" :search="searchSM" :sort-by="sortBySM" :sort-desc="sortDescSM" :items-per-page="12"
              :footer-props="{'items-per-page-options':[12,24,36,48,60]}" no-data-text="Please add simple meta first" no-results-text="No meta found">
              <template v-slot:header>
                <div class="headline text-center py-2">List of simple meta</div>
                <v-toolbar class="mb-4" color="secondary" dense elevation="0">
                  <v-text-field v-model="searchSM" dense clearable flat solo outlined hide-details prepend-inner-icon="mdi-magnify" label="Search"></v-text-field>
                  <v-spacer class="mx-2"/>
                  <v-select v-model="sortBySM" dense flat solo outlined hide-details :items="['name','dataType','date','edit']" prepend-inner-icon="mdi-sort" label="Sort by"></v-select>
                  <v-spacer class="mx-2"/>
                  <v-btn-toggle v-model="sortDescSM" dense mandatory>
                    <v-btn outlined :value="false"> <v-icon>mdi-arrow-up</v-icon> </v-btn>
                    <v-btn outlined :value="true"> <v-icon>mdi-arrow-down</v-icon> </v-btn>
                  </v-btn-toggle>
                </v-toolbar>
              </template>

              <template v-slot:default="props">
                <v-row class="px-4">
                  <v-col v-for="item in props.items" :key="item.id" cols="12" sm="4" md="3" lg="4">
                    <v-hover>
                      <template v-slot:default="{ hover }">
                        <v-card outlined height="100%" class="meta-list-card">
                          <v-toolbar color="secondary">
                            <v-icon size="20" left>mdi-{{ item.settings.icon }}</v-icon>
                            {{ item.settings.name }} 
                          </v-toolbar>
                          <v-chip-group column class="px-2">
                            <span class="mr-2 caption">Data type:</span>
                            <v-chip x-small class="px-2">
                              <v-icon x-small class="mr-1">{{ getIconDataType(item.dataType) }}</v-icon>{{ item.dataType }}
                            </v-chip>
                          </v-chip-group>
                          <v-chip-group column class="px-2">
                            <span class="mr-2 caption">Assigned to:</span>
                            <v-chip v-for="(m, i) in item.assigned" :key="m.id+i" x-small class="px-1">
                              <v-icon x-small> mdi-{{m.settings.icon}} </v-icon> {{m.settings.name}}
                            </v-chip>
                          </v-chip-group>

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
                <v-divider class="mt-4"></v-divider>
              </template>
            </v-data-iterator>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
    
    <v-dialog v-model="dialogAddMeta" scrollable max-width="800">
      <v-card>
        <v-toolbar color="primary">
          <div class="headline">Adding a new meta</div>
          <v-spacer></v-spacer>
          <v-btn @click="dialogAddMeta=false" outlined><v-icon left>mdi-close</v-icon>Cancel</v-btn>
        </v-toolbar>
        <v-alert type="info" text outlined class="ma-4">
          Meta are pieces of information that you can add to video and meta cards. <br>
          There are two types of meta: complex and simple.
        </v-alert>
        <div class="pb-6 px-4 d-flex justify-space-around">
          <v-card @click="dialogAddComplexMeta=true, dialogAddMeta=false" hover height="100%">
            <v-toolbar color="primary" class="headline">Add complex meta</v-toolbar>
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
          <v-card @click="dialogAddSimpleMeta=true, dialogAddMeta=false" hover height="100%">
            <v-toolbar color="secondary" class="headline">Add simple meta</v-toolbar>
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
        </div>
      </v-card>
    </v-dialog>

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
import MetaGetters from '@/mixins/MetaGetters.vue'

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
    searchCM: '',
    searchSM: '',
    sortDescCM: false,
    sortDescSM: false,
    sortByCM: 'name',
    sortBySM: 'name',
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
    complexMetaList() { 
      let complexMeta = this.$store.state.Meta.complexMetaList
      return complexMeta.map(i=>{
        let attrs = []
        if (i.settings.favorite) attrs.push({name:'Favorite', icon:'heart'})
        if (i.settings.rating) attrs.push({name:'Rating', icon:'star'})
        if (i.settings.bookmark) attrs.push({name:'Bookmark', icon:'bookmark'})
        if (i.settings.synonyms) attrs.push({name:'Synonyms', icon:'alphabetical-variant'})
        if (i.settings.country) attrs.push({name:'Country', icon:'flag'})
        if (i.settings.scraper) attrs.push({name:'Scraper', icon:'magnify'})
        if (i.settings.nested) attrs.push({name:'Nested', icon:'file-tree'})
        return {...i,...{attrs},...{name:i.settings.name}}
      }) 
    },
    simpleMetaList() { 
      let complexMeta = this.$store.state.Meta.complexMetaList
      return this.$store.state.Meta.simpleMetaList.map(i=>{
        let assigned = complexMeta.filter(cm=>cm.settings.metaInCard.find(m=>m.id===i.id))
        let assignedToVideos = this.$store.state.Settings.metaAssignedToVideos.find(m=>m.id===i.id)
        if (assignedToVideos) assigned.push({settings:{name:'Videos',icon:'video'}})
        return {...i,...{assigned},...{name:i.settings.name}} 
      }) 
    },
    pathToUserData() { return this.$store.getters.getPathToUserData },
  },
  methods: {
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
          hidden: true,
          parser: false,
          imageAspectRatio: 1,
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
        if (m.state.filters) for (let f of m.state.filters) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.getters.settings.get('videoFilters').each(f=>{ // rename in filters of videos
        if (f.by === meta.id) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.getters.savedFilters.each(sfType=>{ // rename in filters of saved filters
        for (let sf of sfType) for (let f of sf.filters) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.dispatch('updateSavedFilters')
      this.$store.getters.settings.get('tabs').each(tab=>{ // rename in filters of tabs
        if (tab.filters) for (let f of tab.filters) if (f.by === meta.id) type = 'select'
      }).write()
      this.$store.commit('updateSettingsState', 'tabs') // update tabs
      this.$store.commit('updateComplexMetaListFromDb')
      this.$store.commit('updateSimpleMetaListFromDb')
      this.dialogTransferMeta = false
    },
    deleteMeta() {
      let meta = this.selectedMeta
      if (meta.type == 'complex') this.$store.dispatch('deleteComplexMeta', {id:meta.id, name:meta.settings.name})
      else if (meta.type == 'simple') this.$store.dispatch('deleteSimpleMeta', {id:meta.id, name:meta.settings.name})
      this.$store.commit('updateComplexMetaListFromDb')
      this.$store.commit('updateSimpleMetaListFromDb')
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