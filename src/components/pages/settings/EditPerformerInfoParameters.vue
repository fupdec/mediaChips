<template>
	<div>
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
    <v-btn @click="openParam('Cups', 'coffee')" small class="ma-2"> 
      <v-icon left>mdi-coffee</v-icon> Cups
    </v-btn>
    <v-btn @click="openParam('Body', 'human-child')" small class="ma-2"> 
      <v-icon left>mdi-human-child</v-icon> Body
    </v-btn>
    <v-btn @click="openParam('Pussy', 'cat')" small class="ma-2"> 
      <v-icon left>mdi-cat</v-icon> Pussy
    </v-btn>
    <v-btn @click="openParam('PussyLips', 'cat')" small class="ma-2"> 
      <v-icon left>mdi-cat</v-icon> Pussy lips
    </v-btn>
    <v-btn @click="openParam('PussyHair', 'cat')" small class="ma-2"> 
      <v-icon left>mdi-cat</v-icon> Pussy hair
    </v-btn>

    <v-dialog :value="dialogEditItems" width="400" persistent scrollable eager>
      <v-card>
        <v-card-title class="py-1 headline">
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
          <v-btn @click="dialogDeleteItem=true" small class="ma-2" color="red" dark :disabled="isBtnsDisbaled"> 
            <v-icon>mdi-delete</v-icon> 
          </v-btn>
          <v-btn @click="openDialogEditItemName" small class="ma-2" color="orange" :disabled="isBtnsDisbaled"> 
            <v-icon>mdi-pencil</v-icon> 
          </v-btn>
          <v-btn @click="dialogAddItem=true" small class="ma-2" color="green"> 
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
          <v-form ref="formName" v-model="validName">
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

    <v-dialog v-if="dialogEditItemName" :value="dialogEditItemName" width="600" persistent>
      <v-card>
        <v-card-title class="py-1 headline"> Edit name of item
          <v-spacer></v-spacer>
          <v-icon>mdi-pencil</v-icon>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pt-6">
          <v-form ref="formNameNew" v-model="validNameNew">
            <v-text-field v-model="itemNameNew" :rules="[getNameRules]" validate-on-blur 
              dense outlined label="New name of item" counter="50"/>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-btn @click="dialogEditItemName=false" class="ma-2">Cancel</v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="saveItemName" class="ma-2" color="primary" :disabled="!validNameNew"> 
            <v-icon left>mdi-content-save</v-icon> Save
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
  name: 'EditPerformerInfoParameters',
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
    dialogEditItemName: false,
    dialogDeleteItem: false,
    itemName: '',
    itemNameNew: '',
    validName: false,
    validNameNew: false,
  }),
  computed: {
    items() {
      return this.$store.state.Settings['performerInfo'+this.param]
    },
    isBtnsDisbaled() {
      return this.itemsSelected === undefined || this.items.length === 0
    },
  },
  methods: {
    getNameRules(name) {
      let duplicate = this.items.includes(name)
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
    openParam(param, icon) {
      this.param = param
      this.paramIcon = icon
      this.dialogEditItems = true
    },
    addItem() {
      if (!this.validName) return
      const values = {
        param: 'performerInfo'+this.param,
        value: this.itemName,
      }
      this.$store.dispatch('addItemToPerformerInfoParam', values)
      this.dialogAddItem = false
    },
    openDialogEditItemName() {
      this.dialogEditItemName = true
      this.itemNameNew = this.items[this.itemsSelected]
    },
    saveItemName() {
      if (!this.validNameNew) return

      const param = this.param.charAt(0).toLowerCase() + this.param.slice(1)
      const oldName = this.items[this.itemsSelected]
      const newName = this.itemNameNew
      // update param in settings
      this.items[this.itemsSelected] = newName
      const values = {
        param: 'performerInfo'+this.param,
        value: this.items,
      }
      this.$store.dispatch('updatePerformerInfoParam', values)
      // update param in all performer profiles
      this.$store.getters.performers.filter(p=>(p[param].includes(oldName)))
        .each(p=>{
          const i = p[param].indexOf(oldName)
          p[param][i] = newName
        }).write()
      this.dialogEditItemName = false
    },
    deleteItem() {
      const param = this.param.charAt(0).toLowerCase() + this.param.slice(1)
      const item = this.items[this.itemsSelected]
      // update param in settings
      this.items.splice(this.itemsSelected, 1)
      const values = {
        param: 'performerInfo'+this.param,
        value: this.items,
      }
      this.$store.dispatch('updatePerformerInfoParam', values)
      // update param in all performer profiles
      this.$store.getters.performers.filter(p=>(p[param].includes(item)))
        .each(p=>{
          const i = p[param].indexOf(item)
          p[param].splice(i, 1)
        }).write()
      this.dialogDeleteItem = false
    },
  },
}
</script>