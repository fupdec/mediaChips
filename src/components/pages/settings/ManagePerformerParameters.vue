<template>  
	<div>
    <v-dialog v-model="$store.state.Settings.dialogManagePerformerParameters" persistent scrollable width="800">
      <v-card>
        <v-card-title class="headline">Management performer parameters
          <v-spacer></v-spacer>
          <v-icon>mdi-account</v-icon>
        </v-card-title>
        <v-divider></v-divider> 
        <vuescroll>
          <v-card-text class="pt-0" v-if="customParameters.length">
            <div class="text-center overline pt-5">Parameters</div>
            <v-list dense>
              <v-list-item-group color="red" v-model="selectedParam">
                <v-list-item v-for="(param, i) in customParameters" :key="i">
                  <v-icon left>{{getIconParam(param.type)}}</v-icon> 
                  <div class="d-flex justify-space-between" style="width:100%">
                    <span>{{param.name}}</span>
                    <i class="ml-2">(type: {{param.type}})</i>
                  </div>
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
          <v-card-text class="text-center" v-else>
            <v-icon size="32">mdi-close</v-icon>
            <div class="overline">No parameters</div>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pt-0">
          <v-btn @click="$store.state.Settings.dialogManagePerformerParameters=false" class="ma-4">Close</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteParam=true" :disabled="selectedParam===undefined" dark class="ma-4" color="red"> 
            <v-icon left>mdi-delete</v-icon> Delete parameter </v-btn>
          <v-btn @click="dialogAddPerformerParameter=true" dark class="ma-4" color="green"> 
            <v-icon left>mdi-plus</v-icon> Add new parameter </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteParam" v-model="dialogDeleteParam" persistent scrollable width="480">
      <v-card>
        <v-card-title class="headline red--text">Deleting parameter
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider> 
        <vuescroll>
          <v-card-text class="text-center">
            <div>Do you want to remove the parameter named "{{customParameters[selectedParam].name}}"?</div>
            <div>It will be permanently deleted from all performers.</div>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pt-0">
          <v-btn @click="dialogDeleteParam=false" class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="deleteParam" class="ma-4" color="red" dark> 
            <v-icon left>mdi-delete-alert</v-icon> Delete parameter </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogAddPerformerParameter" persistent scrollable width="640">
      <v-card>
        <v-card-title class="headline">Adding new performer parameter
          <v-spacer></v-spacer>
          <v-icon>mdi-account</v-icon>
        </v-card-title>
        <v-divider></v-divider> 
        
        <vuescroll>
          <v-card-text>
            <div class="d-flex">
              <v-form v-model="validParamName" class="flex-grow-1" @submit.prevent>
                <v-text-field v-model="paramName" :rules="[paramNameRules]" 
                  dense outlined label="Name of parameter" prepend-icon="mdi-alphabetical-variant"/>
              </v-form>
              <v-select v-model="paramType" :items="paramTypes" 
                label="Type of parameter" outlined dense class="ml-6 flex-grow-1"
                prepend-icon="mdi-shape" :menu-props="{contentClass:'list-with-preview'}">
                <template v-slot:item="data">
                  <div class="list-item"> 
                    <v-icon left size="14">{{getIconParam(data.item)}}</v-icon>
                    <span>{{data.item}}</span>
                  </div>
                </template>
              </v-select>
            </div>
            
            <v-form v-if="validParamName && paramType=='array'" v-model="validParamItem" @submit.prevent>
              <div class="overline text-center mb-2">Items for parameter "{{paramName}}"</div>
              <div class="d-flex">
                <v-btn @click="addNewItem" :disabled="!validParamItem" class="mr-4" color="green" rounded> 
                  <v-icon left>mdi-plus</v-icon> Add item
                </v-btn>
                <v-text-field v-model="itemName" :rules="[itemNameRules]" @keyup.enter="tryAddNewItem"
                  dense outlined label="Name of item" />
              </div>
              <div v-if="items.length <= 1" class="caption text-center mb-2">
                <v-icon small left color="info">mdi-information-outline</v-icon>
                There must be more than 2 items</div>
              <v-chip-group column>
                <v-chip v-for="item in items" :key="item"
                  @click:close="removeItem(item)" close close-icon="mdi-close">{{item}}</v-chip>
              </v-chip-group>
            </v-form>
          </v-card-text>
        </vuescroll>
        <v-card-actions class="pt-0">
          <v-btn @click="dialogAddPerformerParameter=false" class="ma-4">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="addNewParam" class="mt-1 mr-4" color="green" 
            :disabled="paramType=='array'&&items.length<=1 || !validParamName || !paramType"> 
            <v-icon left>mdi-plus</v-icon> Add parameter </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import vuescroll from 'vuescroll'

export default {
  name: 'ManagePerformerParameters',
  components: {
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    dialogDeleteParam: false,
    dialogAddPerformerParameter: false,
    selectedParam: undefined,
    paramName: '',
    validParamName: false,
    paramType: '',
    paramTypes: ['string','number','array','boolean','date',],
    itemName: '',
    items: [],
    validParamItem: false,
    reservedPerformer: ['id','name','date','aliases','tags','favorite','rating','nations','birthday','start','ethnicity','hair','eyes','height','weight','boobs','cups','bookmark','bra','waist','hip','category','edit','videos','videoTags','websites'],
  }),
  computed: {
    customParameters() {
      return this.$store.state.Settings.customParametersPerformer
    },
  },
  methods: {
    paramNameRules(name) {
      let duplicate = _.find(this.customParameters, p=>p.name.toLowerCase()==name.toLowerCase()) 
      let reserved = this.reservedPerformer.includes(name.toLowerCase())
      if (name.length > 30) {
        return 'Name must be less than 30 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (!/^[a-zA-Z]*$/g.test(name)) {
        return 'Name must content only letters'
      } else if (duplicate!==undefined && duplicate) {
        return 'Parameter with that name already exists'
      } else if (reserved) {
        return 'Parameter with that name is reserved'
      } else {
        return true
      }
    },
    itemNameRules(name) {
      let duplicate = this.items.includes(name)
      if (name.length > 30) {
        return 'Name must be less than 30 characters'
      } else if (name.length===0) {
        return 'Name is required'
      } else if (/[\\\/\%"?<>{}\[\]]/g.test(name)) {
        return 'Name must not content \\/\%\"<>{}\[\]'
      } else if (duplicate) {
        return 'Item with that name already exists'
      } else {
        return true
      }
    },
    getIconParam(param) {
      if (param === 'string') return 'mdi-alphabetical'
      if (param === 'date') return 'mdi-calendar'
      if (param === 'number') return 'mdi-numeric'
      if (param === 'array') return 'mdi-code-array'
      if (param === 'boolean') return 'mdi-toggle-switch'
      return 'mdi-shape'
    },
    tryAddNewItem() {
      if (this.validParamItem) this.addNewItem()
    },
    addNewParam() {
      let items = this.items.sort((a, b) => a.localeCompare(b))
      let param = {
        name: this.paramName,
        type: this.paramType,
        items: _.cloneDeep(items),
      }
      let params = this.$store.getters.settings.get('customParametersPerformer')
      params.push(param).write()
      this.$store.state.Settings.customParametersPerformer = _.cloneDeep(params.value())
      // add parameter to the performers database
      if (param.type === 'string' || param.type === 'date' || param.type === 'number') {
        this.$store.getters.performers.each(p=>{p[param.name]=''}).write() }
      if (param.type === 'array') this.$store.getters.performers.each(p=>{p[param.name]=[]}).write()
      if (param.type === 'boolean') this.$store.getters.performers.each(p=>{p[param.name]=false}).write()
      this.dialogAddPerformerParameter = false
    },
    deleteParam() {
      let paramName = this.customParameters[this.selectedParam].name
      let params = this.$store.getters.settings.get('customParametersPerformer')
      params.remove({name: paramName}).write()
      this.$store.state.Settings.customParametersPerformer = _.cloneDeep(params.value())
      this.$store.getters.performers.each(p=>{p[paramName]=undefined}).write()
      this.dialogDeleteParam = false
      this.selectedParam = undefined
    },
    addNewItem() {
      this.items.push(this.itemName)
      this.itemName = ''
    },
    removeItem(item) { 
      const index = this.items.indexOf(item)
      if (index >= 0) this.items.splice(index, 1)
    },
  },
}
</script>