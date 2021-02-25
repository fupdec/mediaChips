<template>
  <v-dialog v-model="$store.state.dialogFolder" scrollable persistent width="1200">
    <v-card>
      <v-card-title primary-title class="py-1 px-4">
        <div class="headline">{{folder.folder}}</div>
        <v-spacer></v-spacer>
        <v-icon>mdi-folder</v-icon>
      </v-card-title>
      <v-divider></v-divider>
      <v-card-actions v-if="folder.lostFiles.length" class="pa-4">
        <v-alert dense text color="orange" class="mb-0">
          Number of videos lost: {{folder.lostFiles.length}}
        </v-alert>
        <v-spacer></v-spacer>
        <v-btn @click="listLostFiles=!listLostFiles" color="orange">
          Toggle full list
        </v-btn>
      </v-card-actions>
      <vuescroll v-if="listLostFiles">
        <v-card-text class="py-0">
          <v-alert text dense outlined color="orange" class="ma-0 caption">
            <span v-for="(filePath, i) in folder.lostFiles" :key="i">{{i+1}}) {{filePath}}<br></span>
          </v-alert>
        </v-card-text>
      </vuescroll>
      <v-card-actions v-if="folder.newFiles.length" class="pa-4">
        <v-alert dense text color="blue" class="mb-0">
          Number of videos new: {{folder.newFiles.length}}
        </v-alert>
        <v-spacer></v-spacer>
        <v-btn @click="listNewFiles=!listNewFiles" color="blue">
          Toggle full list
        </v-btn>
      </v-card-actions>
      <vuescroll v-if="listNewFiles">
        <v-card-text class="py-0">
          <v-alert text dense outlined color="blue" class="ma-0 caption">
            <span v-for="(filePath, i) in folder.newFiles" :key="i">{{i+1}}) {{filePath}}<br></span>
          </v-alert>
        </v-card-text>
      </vuescroll>
      <v-card-actions class="pa-0">
        <v-btn @click="$store.state.dialogFolder=false" class="ma-4">
          <v-icon left>mdi-close</v-icon> Close
        </v-btn>
        <v-spacer></v-spacer>
        <!-- <v-btn @click="$store.state.dialogFolder=false" class="ma-4" color="red" dark>
          <v-icon left>mdi-delete</v-icon> Delete videos
        </v-btn>
        <v-btn @click="$store.state.dialogFolder=false" class="ma-4" color="orange" dark>
          <v-icon left>mdi-pencil</v-icon> Update paths
        </v-btn> -->
        <v-btn @click="$store.state.dialogFolder=false" class="ma-4" color="green" dark>
          <v-icon left>mdi-plus</v-icon> Add new videos
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: "DialogFolder",
  props: {
    folder: Object,
	},
  components: {
    vuescroll,
	},
  mixins: [], 
  mounted () {
    this.$nextTick(function () {})
  },
  updated() {
  },
  data: () => ({
    listLostFiles: false,
    listNewFiles: false,
  }),
  computed: {
  },
  methods: {
  },
  watch: {
  }
}
</script>