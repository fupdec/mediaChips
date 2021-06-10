<template>
  <div>
    <v-btn class="mb-4" color="primary" block x-large rounded> <v-icon left>mdi-plus</v-icon> Add new meta</v-btn>

    <v-card outlined>
      <v-data-iterator :items="metaList" :items-per-page.sync="itemsPerPage" :page.sync="page" :search="search" :sort-by="sortBy" :sort-desc="sortDesc" hide-default-footer no-data-text="Please add meta first" no-results-text="No meta found">
        <template v-slot:header>
          <v-toolbar color="primary" class="mb-4">
            <v-text-field v-model="search" dense clearable flat solo-inverted hide-details prepend-inner-icon="mdi-magnify" label="Search"></v-text-field>
            <v-spacer></v-spacer>
            <v-select v-model="sortBy" dense flat solo-inverted hide-details :items="keys" prepend-inner-icon="mdi-magnify" label="Sort by"></v-select>
            <v-spacer></v-spacer>
            <v-btn-toggle v-model="sortDesc" dense mandatory background-color="primary">
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
                    <div class="px-2 py-1 d-flex align-center">
                      <v-icon size="20" left>mdi-{{ item.settings.icon }}</v-icon>
                      {{ item.settings.name }} 
                    </div>
                    <v-divider></v-divider>
                    <v-list dense class="list-zebra caption">
                      <v-list-item v-for="(key, index) in filteredKeys" :key="index" class="px-2 py-1">
                        <v-list-item-content class="py-0" :class="{'primary--text':sortBy===key}">
                          {{ key }}:
                        </v-list-item-content>
                        <v-list-item-content class="py-0 align-end" :class="{'primary--text':sortBy===key}" >
                          <span v-if="key=='date'">{{ dateAdded(item[key]) }}</span>
                          <span v-else-if="key=='edit'">{{ dateEdit(item[key]) }}</span>
                          <span v-else>{{ item[key] }}</span>
                        </v-list-item-content>
                      </v-list-item>
                      <div v-if="item.type==='complex'">
                        <div class="px-2 py-1 d-flex align-center justify-space-between">
                          <span class="mr-2">Assigned meta:</span>
                          <span class="d-flex align-center flex-wrap"> 
                            <v-icon v-for="(m, i) in item.metaInCard" :key="i" small> 
                              mdi-{{getMeta(m.id).settings.icon}} </v-icon> 
                          </span>
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
                            <v-icon v-if="item.nested" small>mdi-file-tree</v-icon>
                          </span>
                        </div>
                      </div>
                    </v-list>

                    <v-fade-transition>
                      <v-overlay v-if="hover" absolute color="secondary">
                        <div class="d-flex flex-column">
                          <v-btn rounded small class="mb-2"> <v-icon left>mdi-cog</v-icon> Edit </v-btn>
                          <v-btn v-if="item.dataType==='array'" rounded small class="mb-2"> <v-icon left>mdi-card</v-icon> cards </v-btn>
                          <v-btn rounded small color="error"> <v-icon left>mdi-delete</v-icon> Delete </v-btn>
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
          <v-toolbar color="primary" class="mt-4" dense>
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
            <span>Total meta: {{ metaList.length }}</span>
            <v-spacer></v-spacer>
            <span> Page {{ page }} of {{ numberOfPages }} </span>
            <v-btn small outlined class="mx-2" @click="formerPage"> <v-icon>mdi-arrow-left</v-icon> </v-btn>
            <v-btn small outlined @click="nextPage"><v-icon>mdi-arrow-right</v-icon></v-btn>
          </v-toolbar>
        </template>
      </v-data-iterator>
    </v-card>
  </div>
</template>

<script>
import MetaGetters from '@/mixins/MetaGetters'

export default {
  name: 'MetaList',
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
      'date',
      'edit',
      'type',
      'dataType',
      'id',
    ],
    items: [
      {
        name: 'Frozen Yogurt',
        calories: 159,
        fat: 6.0,
        carbs: 24,
        protein: 4.0,
        sodium: 87,
        calcium: '14%',
        iron: '1%',
      },
      {
        name: 'Ice cream sandwich',
        calories: 237,
        fat: 9.0,
        carbs: 37,
        protein: 4.3,
        sodium: 129,
        calcium: '8%',
        iron: '1%',
      },
      {
        name: 'Eclair',
        calories: 262,
        fat: 16.0,
        carbs: 23,
        protein: 6.0,
        sodium: 337,
        calcium: '6%',
        iron: '7%',
      },
      {
        name: 'Cupcake',
        calories: 305,
        fat: 3.7,
        carbs: 67,
        protein: 4.3,
        sodium: 413,
        calcium: '3%',
        iron: '8%',
      },
      {
        name: 'Gingerbread',
        calories: 356,
        fat: 16.0,
        carbs: 49,
        protein: 3.9,
        sodium: 327,
        calcium: '7%',
        iron: '16%',
      },
      {
        name: 'Jelly bean',
        calories: 375,
        fat: 0.0,
        carbs: 94,
        protein: 0.0,
        sodium: 50,
        calcium: '0%',
        iron: '0%',
      },
      {
        name: 'Lollipop',
        calories: 392,
        fat: 0.2,
        carbs: 98,
        protein: 0,
        sodium: 38,
        calcium: '0%',
        iron: '2%',
      },
      {
        name: 'Honeycomb',
        calories: 408,
        fat: 3.2,
        carbs: 87,
        protein: 6.5,
        sodium: 562,
        calcium: '0%',
        iron: '45%',
      },
      {
        name: 'Donut',
        calories: 452,
        fat: 25.0,
        carbs: 51,
        protein: 4.9,
        sodium: 326,
        calcium: '2%',
        iron: '22%',
      },
      {
        name: 'KitKat',
        calories: 518,
        fat: 26.0,
        carbs: 65,
        protein: 7,
        sodium: 54,
        calcium: '12%',
        iron: '6%',
      },
    ],
  }),
  computed: {
    numberOfPages() { return Math.ceil(this.metaList.length / this.itemsPerPage) },
    filteredKeys() { return this.keys.filter(key => key !== 'name') },
    metaList() { 
      let allMeta = this.$store.getters.meta.filter(i=>['simple','complex'].includes(i.type))
      allMeta = allMeta.map(i=>{ 
        if (i.type==='complex') return {...i, ...i.settings, ...{dataType:'cards'}}  
        else return {...i, ...i.settings} 
      })
      return allMeta.value() 
    },
  },
  methods: {
    nextPage() { if (this.page + 1 <= this.numberOfPages) this.page += 1 },
    formerPage() { if (this.page - 1 >= 1) this.page -= 1 },
    updateItemsPerPage(number) { this.itemsPerPage = number },
    dateAdded(date) {
      date = new Date(date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit(date) {
      date = new Date(date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
}
</script>


<style lang="less">
.meta-list-card {
  .v-list-item {
    min-height: auto;
  }
}
</style>