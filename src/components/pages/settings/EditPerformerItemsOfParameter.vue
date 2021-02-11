<template>
	<div>
    <div class="overline text-right">Default parameters</div>
    <v-divider></v-divider>
    <v-btn @click="openParam('Category', 'account-group-outline')" small class="ma-2"> 
      <v-icon left>mdi-account-group-outline</v-icon> Category
    </v-btn>
    <v-btn @click="openParam('Ethnicity', 'account-group')" small class="ma-2"> 
      <v-icon left>mdi-account-group</v-icon> Ethnicity
    </v-btn>
    <v-btn @click="openParam('Hair', 'face-woman')" small class="ma-2"> 
      <v-icon left>mdi-face-woman</v-icon> Hair
    </v-btn>
    <v-btn @click="openParam('Eyes', 'eye')" small class="ma-2"> 
      <v-icon left>mdi-eye</v-icon> Eyes
    </v-btn>
    <v-btn @click="openParam('Boobs', 'vector-circle-variant')" small class="ma-2"> 
      <v-icon left>mdi-vector-circle-variant</v-icon> Boobs
    </v-btn>
    <v-btn @click="openParam('Cups', 'coffee')" small class="ma-2"> 
      <v-icon left>mdi-coffee</v-icon> Cups
    </v-btn>

    <div class="overline text-right mt-2">Custom parameters</div>
    <v-divider></v-divider>
    
    <v-btn v-for="btn in customParameters" :key="btn.name" @click="openParam(btn.name, 'shape', true)" small class="ma-2"> 
      <v-icon left>mdi-shape</v-icon> {{btn.name}}
    </v-btn>

    <v-dialog :value="dialogEditItems" width="400" persistent scrollable eager>
      <v-card>
        <v-card-title class="py-1 px-4 headline">
          {{param}}
          <v-spacer></v-spacer>
          <v-icon>mdi-{{paramIcon}}</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <vuescroll>
          <v-card-text class="pa-0">
            <v-list dense>
              <v-list-item-group v-model="itemsSelected" color="secondary">
                <v-list-item v-for="(item, i) in items" :key="i">
                  {{item}}
                </v-list-item>
              </v-list-item-group>
            </v-list>
          </v-card-text>
        </vuescroll>
        <v-card-actions>
          <v-btn @click="dialogEditItems=false" small class="ma-2">
            <v-icon left>mdi-close</v-icon> Close
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="dialogDeleteItem=true" small dark class="ma-2" color="red" :disabled="isBtnsDisbaled"> 
            <v-icon>mdi-delete</v-icon> 
          </v-btn>
          <v-btn @click="openDialogEditItemName" small dark class="ma-2" color="orange" :disabled="isBtnsDisbaled"> 
            <v-icon>mdi-pencil</v-icon> 
          </v-btn>
          <v-btn @click="dialogAddItem=true" small dark class="ma-2" color="green"> 
            <v-icon>mdi-plus</v-icon> 
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogAddItem" :value="dialogAddItem" width="600" persistent>
      <v-card>
        <v-card-title class="py-1 headline"> Add new item
          <v-spacer></v-spacer>
          <v-icon>mdi-plus</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <v-form ref="formName" v-model="validName" @submit.prevent>
            <v-text-field v-model="itemName" :rules="[getNameRules]" validate-on-blur 
              dense outlined label="Name of item" counter="50"/>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogAddItem=false" class="ma-2">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="addItem" class="ma-2" color="primary" :disabled="!validName"> 
            <v-icon left>mdi-plus</v-icon> Add
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogRenameItem" :value="dialogRenameItem" width="600" persistent>
      <v-card>
        <v-card-title class="py-1 headline"> Rename item
          <v-spacer></v-spacer>
          <v-icon>mdi-pencil</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <v-form ref="formNameNew" v-model="validNameNew" @submit.prevent>
            <v-text-field v-model="itemNameNew" :rules="[getNameRules]" validate-on-blur 
              dense outlined label="New name of item" counter="50"/>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogRenameItem=false" class="ma-2">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="renameItem" class="ma-2" color="primary" :disabled="!validNameNew"> 
            <v-icon left>mdi-form-textbox</v-icon> Rename
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-if="dialogDeleteItem" :value="dialogDeleteItem" width="460" persistent>
      <v-card>
        <v-card-title class="py-1 headline red--text"> Delete item?
          <v-spacer></v-spacer>
          <v-icon color="red">mdi-delete</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6 text-center">
          Item "{{items[itemsSelected]}}" will be delete from all performer profiles!
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogDeleteItem=false" class="ma-2">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="deleteItem" class="ma-2" color="red" dark> 
            <v-icon left>mdi-delete-alert</v-icon> Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>


<script>
import vuescroll from 'vuescroll'

export default {
  name: 'EditPerformerItemsOfParameter',
  components: {
    vuescroll,
  },
  mounted() {
    this.$nextTick(function () {
    })
  },
  data: () => ({
    param: '',
    paramIcon: '',
    itemsSelected: undefined,
    dialogEditItems: false,
    dialogAddItem: false,
    dialogRenameItem: false,
    dialogDeleteItem: false,
    itemName: '',
    itemNameNew: '',
    validName: false,
    validNameNew: false,
    isCustomParam: false,
  }),
  computed: {
    items() {
      if (this.isCustomParam) {
        return this.$store.getters.settings.get('customParametersPerformer').find({name:this.param}).value().items
      } else return this.$store.state.Settings['performerInfo'+this.param]
    },
    isBtnsDisbaled() {
      return this.itemsSelected === undefined || this.items.length === 0
    },
    customParameters() {
      return _.filter(this.$store.state.Settings.customParametersPerformer, {type:'array'})
    },
  },
  methods: {
    getNameRules(name) {
      let itemsLower = this.items.map(i=>i.toLowerCase())
      let duplicate = itemsLower.includes(name.toLowerCase())
      if (name.length > 50) {
        return 'Name must be less than 50 characters'
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
    openParam(param, icon, isCustomParam) {
      if (isCustomParam) {
        this.isCustomParam = true
      } else this.isCustomParam = false
      this.param = param
      this.paramIcon = icon
      this.dialogEditItems = true
    },
    updateParamsInSettings() {
      if (this.isCustomParam) {
        let params = this.$store.getters.settings.get('customParametersPerformer')
        params.find({name:this.param}).set('items', this.items).write()
        this.$store.state.Settings.customParametersPerformer = _.cloneDeep(params.value())
      } else {
        const values = {
          key: 'performerInfo' + this.param, 
          value: this.items,
        }
        this.$store.dispatch('updateSettingsState', values)
      }
    },
    addItem() {
      if (!this.validName) return
      this.items.push(this.itemName)
      this.updateParamsInSettings()
      this.dialogAddItem = false
    },
    openDialogEditItemName() {
      this.dialogRenameItem = true
      this.itemNameNew = this.items[this.itemsSelected]
    },
    renameItem() {
      if (!this.validNameNew) return
      
      const oldName = this.items[this.itemsSelected]
      const newName = this.itemNameNew
      let param = this.param
      this.items[this.itemsSelected] = newName
      this.updateParamsInSettings()
      // update param in database of performers
      if (!this.isCustomParam) param = this.param.toLowerCase()
      this.$store.getters.performers.filter(p=>p[param].includes(oldName)).each(p=>{
          const i = p[param].indexOf(oldName)
          p[param][i] = newName
        }).write()
      // rename item in performer page filters
      this.$store.getters.settings.get('performerFilters').filter({param: param})
        .filter(f=>f.val.includes(oldName)).each(f=>{
          const i = f.val.indexOf(oldName)
          f.val[i] = newName
        }).write()
      // close all tabs with performers page
      let ids = this.$store.getters.settings.get('tabs').filter(t=>t.link.includes('/performers/:')).map('id').value()
      for (let i=0; i<ids.length; i++) {
        this.$store.dispatch('closeTab', ids[i])
      }
      
      this.dialogRenameItem = false
    },
    deleteItem() {
      let param = this.param
      const item = this.items[this.itemsSelected]
      this.items.splice(this.itemsSelected, 1)
      this.updateParamsInSettings()
      // update param in database of performers
      if (!this.isCustomParam) param = this.param.toLowerCase()
      this.$store.getters.performers.filter(p=>(p[param].includes(item))).each(p=>{
          const i = p[param].indexOf(item)
          p[param].splice(i, 1)
        }).write()
      // delete item in performer page filters
      this.$store.getters.settings.get('performerFilters').filter({param: param})
        .filter(f=>f.val.includes(item)).each(f=>{
          const i = f.val.indexOf(item)
          f.val.splice(i, 1)
        }).write()
      // close all tabs with performers page
      let ids = this.$store.getters.settings.get('tabs').filter(t=>t.link.includes('/performers/:')).map('id').value()
      for (let i=0; i<ids.length; i++) {
        this.$store.dispatch('closeTab', ids[i])
      }
      this.dialogDeleteItem = false
    },
  },
}
</script>