<template>
  <div>
    <v-bottom-sheet v-model="$store.state.Meta.dialogEditMetaCard" inset scrollable persistent>
      <v-card class="pb-5">
        <v-card-title>Edit "{{card.meta.name}}"</v-card-title>
        <div class="d-flex justify-space-between px-4">
          <v-chip label outlined class="mr-4">
            <v-icon left size="20">mdi-calendar-plus</v-icon> Added: {{dateAdded}}
          </v-chip>
          <v-chip label outlined>
            <v-icon left size="20">mdi-calendar-edit</v-icon> Last edit: {{dateEdit}}
          </v-chip>
        </div>
        <vuescroll>
          <v-card-text class="pa-0">
            {{card}}
          </v-card-text>
        </vuescroll>
      </v-card>
      <div @click="close" class="left-close-panel">
        <div class="content">
          <v-icon color="red" size="15vw">mdi-close</v-icon>
          <span class="red--text">Close</span>
        </div>
      </div>
      <div @click="save" class="right-close-panel">
        <div class="content">
          <v-icon color="green" size="15vw">mdi-check</v-icon>
          <span class="green--text">Save</span>
        </div>
      </div>
    </v-bottom-sheet>
  </div>
</template>

<script>
import vuescroll from 'vuescroll'

export default {
  name: "DialogEditMetaCard",
  components: {
    vuescroll,
	},
  mounted () {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    isSelectedSingle: null,
  }),
  computed: {
    metaId() { return this.$route.query.metaId },
    card() {
      let ids = this.$store.state.Meta.selectedMeta
      ids.length > 1 ? this.isSelectedSingle=false : this.isSelectedSingle=true 
      let metaCards = this.$store.getters.metaCards.get(this.metaId)
      if (this.$route.path.includes('/meta/:') && this.$router.currentRoute.params.id) {
        if (this.$router.currentRoute.params.id.substring(1)) {
          return metaCards.find({id:this.$router.currentRoute.params.id.substring(1)}).value()
        }
      } else if (this.isSelectedSingle) {
        return metaCards.find({id:ids[0]}).value()
      } else return metaCards.filter(i=>ids.includes(i.id)).value()
    },
    dateAdded() {
      let date = new Date(this.card.date)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
    dateEdit() {
      let date = new Date(this.card.edit)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
    },
  },
  methods: {
    close() { this.$store.state.Meta.dialogEditMetaCard = false },
    save() { this.$store.state.Meta.dialogEditMetaCard = false },
  },
};
</script>