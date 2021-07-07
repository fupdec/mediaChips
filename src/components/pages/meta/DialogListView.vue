<template>
  <v-dialog :value="dialog" @input="close" scrollable width="600">
    <v-card>
      <v-toolbar color="primary">
        <span class="headline">List view for {{meta.settings.name.toLowerCase()}}</span>
        <v-spacer></v-spacer>
        <v-btn @click="save" outlined> <v-icon left>mdi-content-save</v-icon> Save </v-btn>
      </v-toolbar>
      <vuescroll>
        <v-card-text>
          <div class="d-flex flex-wrap">
            <div class="ma-4">
              <p>Sort by</p>
              <v-btn-toggle :value="listView.sortBy" @change="changeSortBy($event)" mandatory color="primary">
                <v-tooltip v-for="s in sortBy" :key="s.name" top>
                  <template v-slot:activator="{ on }">
                    <v-btn v-on="on" :value="s.name" outlined>
                      <v-icon>mdi-{{s.icon}}</v-icon>
                    </v-btn>
                  </template>
                  <span>{{s.tip}}</span>
                </v-tooltip>
              </v-btn-toggle>
            </div>
            
            <div class="ma-4">
              <p>Sort direction</p>
              <v-btn-toggle :value="listView.sortDir" @change="changeSortDir($event)" mandatory color="primary">
                <v-btn v-for="s in sortDir" :key="s.name" :value="s.name" outlined>
                  <v-icon>mdi-{{s.icon}}</v-icon> 
                </v-btn>
              </v-btn-toggle>
            </div>
          </div>
        </v-card-text>
      </vuescroll>
    </v-card>
  </v-dialog>
</template>

<script>
import vuescroll from 'vuescroll'

export default {
  name: "DialogListView",
  props: {
    meta: Object,
  },
  components: { vuescroll },
  mounted () {
    this.$nextTick(function () {
      this.dialog = true
      this.initSortBy()
      if (this.meta.state.listView) this.listView = {...this.listView, ...this.meta.state.listView}
    })
  },
  data: () => ({
    dialog: false,
    listView: {
      sortBy: 'name',
      sortDir: 'asc',
    },
    sortBy: [
      {
        name: 'name',
        icon: 'alphabetical-variant',
        tip: 'Name',
      },
      {
        name: 'date',
        icon: 'calendar-plus',
        tip: 'Date Added',
      },
      {
        name: 'edit',
        icon: 'calendar-edit',
        tip: 'Date of Editing',
      },
    ],
    sortDir: [
      {
        name: 'asc',
        icon: 'arrow-down',
        tip: 'Ascending',
      },
      {
        name: 'desc',
        icon: 'arrow-up',
        tip: 'Descending',
      },
    ],
  }),
  computed: {
  },
  methods: {
    initSortBy() {
      if (this.meta.settings.favorite) {
        this.sortBy.push({
          name: 'favorite',
          icon: 'heart-outline',
          tip: 'Favorite',
        }) 
      } 
      if (this.meta.settings.rating) {
        this.sortBy.push({
          name: 'rating',
          icon: 'star-outline',
          tip: 'Rating',
        }) 
      }
      // TODO videos, views
    },
    close() {
      this.dialog = false
      setTimeout(() => { this.$emit('close') }, 500)
    },
    save() {
      console.log(JSON.stringify(this.listView))
      let id = this.meta.id
      let listView = _.cloneDeep(this.listView)
      this.$store.getters.meta.find({id}).get('state').assign({listView}).write()
      this.close()
    },
    changeSortBy(e) { this.listView.sortBy = e },
    changeSortDir(e) { this.listView.sortDir = e },
  },
}
</script>