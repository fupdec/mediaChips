<template>
  <v-form ref="form" v-model="valid">
    <v-btn v-show="index != 0" @click="toggleUnion" rounded plain small>
      {{ filter.union === "AND" ? "AND" : "OR" }}
    </v-btn>

    <div class="filter-row">
      <v-autocomplete
        @input="setBy($event)"
        :value="filter.param"
        :items="listBy"
        :disabled="filter.lock"
        :filter="filterBy"
        :rules="[(v) => !!v || 'By is required']"
        item-value="param"
        label="Parameter"
        class="by"
        outlined
        hide-details
      >
        <template v-slot:selection="data">
          <v-chip label>
            <v-icon left>mdi-{{ data.item.icon }}</v-icon>
            <span v-html="data.item.text" class="mr-2"></span>
            <v-icon small>{{ getIconType(data.item.type) }}</v-icon>
          </v-chip>
        </template>
        <template v-slot:item="data">
          <template v-if="(typeof data.item !== 'object')">
            <v-list-item-content v-text="data.item" ></v-list-item-content>
          </template>
          <template v-else>
            <v-list-item-avatar>
              <v-icon>mdi-{{ data.item.icon }}</v-icon>
            </v-list-item-avatar>
            <v-list-item-content>
              <v-list-item-title>
                <b> {{ data.item.text }} </b>
              </v-list-item-title>
              <v-list-item-subtitle>
                <v-icon small>{{ getIconType(data.item.type) }}</v-icon>
                <span v-html="data.item.type" class="ml-1" />
              </v-list-item-subtitle>
            </v-list-item-content>
          </template>
        </template>
      </v-autocomplete>

      <v-autocomplete
        @input="setCond($event)"
        :value="filter.cond"
        :items="getListCond(filter.type)"
        :disabled="filter.lock"
        :filter="filterBy"
        :rules="[(v) => !!v || 'Condition is required']"
        item-value="cond"
        label="Condition"
        class="cond mx-sm-2"
        outlined
        hide-details
      >
        <template v-slot:selection="data">
          <v-chip label>
            <v-icon left>mdi-{{ data.item.icon }}</v-icon>
            <span v-html="data.item.text" />
          </v-chip>
        </template>
        <template v-slot:item="data">
          <div class="list-item">
            <v-icon left>mdi-{{ data.item.icon }}</v-icon>
            <span>{{ data.item.text }}</span>
          </div>
        </template>
      </v-autocomplete>

      <v-text-field
        v-if="filter.type === 'string' || filter.type === null"
        @input="setVal($event)"
        :value="filter.val"
        :disabled="
          filter.lock || filter.cond == 'is null' || filter.cond == 'not null'
        "
        :rules="[validVal]"
        label="String"
        class="val"
        outlined
        hide-details
      />

      <v-text-field
        v-if="filter.type === 'number'"
        @input="setVal($event)"
        :value="filter.val"
        :disabled="
          filter.lock || filter.cond == 'is null' || filter.cond == 'not null'
        "
        :rules="[validVal]"
        type="number"
        label="Number"
        class="val"
        outlined
        hide-details
      />

      <v-text-field
        v-if="filter.type === 'date'"
        @click="pickDate"
        :value="filter.val"
        :disabled="
          filter.lock || filter.cond == 'is null' || filter.cond == 'not null'
        "
        :rules="[validVal]"
        label="Date"
        class="val"
        outlined
        readonly
        hide-details
      />

      <MetaInputArray
        v-if="filter.type === 'array' && /\d/.test(filter.param)"
        @input="setVal($event)"
        :metaId="filter.param"
        :cond="filter.cond"
        :value="filter.val"
        :disabled="
          filter.lock || filter.cond == 'is null' || filter.cond == 'not null'
        "
        dialog="filtering"
      />

      <MetaInputCountry
        v-if="filter.param === 'country'"
        @input="setVal($event)"
        :cond="filter.cond"
        :value="filter.val"
        :disabled="
          filter.lock || filter.cond == 'is null' || filter.cond == 'not null'
        "
        dialog="filtering"
      />

      <v-card-actions class="pa-0">
        <v-btn
          @click="duplicate"
          :disabled="filter.type == 'boolean'"
          title="Duplicate filter"
          class="ma-1 ml-sm-3"
          icon
        >
          <v-icon size="22">mdi-content-duplicate</v-icon>
        </v-btn>

        <v-btn
          @click="remove"
          :disabled="filter.lock"
          title="Remove filter"
          class="ma-1"
          color="error"
          icon
        >
          <v-icon size="30">mdi-close</v-icon>
        </v-btn>
      </v-card-actions>
    </div>
  </v-form>
</template>


<script>
import Vue from "vue";

export default {
  name: "FilterRow",
  props: {
    filter: Object,
    index: Number,
    listBy: Array,
  },
  components: {
    MetaInputArray: () => import("@/components/meta/input/MetaInputArray.vue"),
    MetaInputCountry: () =>
      import("@/components/meta/input/MetaInputCountry.vue"),
  },
  data: () => ({
    valid: false,
    listTags: [],
  }),
  computed: {
    apiUrl() {
      return this.$store.state.localhost;
    },
  },
  methods: {
    setBy(val) {
      if (!val) return;
      this.$emit("setBy", val);
    },
    setCond(val) {
      this.$emit("setCond", val);
    },
    setVal(val) {
      this.$emit("setVal", val);
    },
    toggleUnion() {
      const val = this.filter.union === "AND" ? "OR" : "AND";
      this.$emit("setUnion", val);
    },
    duplicate() {
      this.$emit("duplicate");
    },
    getIconType(type) {
      return Vue.prototype.$getIconDataType(type);
    },
    remove() {
      this.$emit("remove");
    },
    getListCond(type) {
      return Vue.prototype.$getListCond(type);
    },
    filterBy(filter, queryText, tagText) {
      if (filter.header) return false;
      let text = filter.text.toLowerCase();
      let query = queryText.toLowerCase();
      return text.includes(query);
    },
    pickDate() {
      this.$emit("pickDate");
    },
    validate() {
      this.$refs.form.validate();
    },
    validVal(val) {
      const cond = this.filter.cond;
      if (val !== null && val.length > 0) return true;
      else if (cond !== "is null" && cond !== "null") return true;
      else return "Value is required";
    },
  },
  watch: {
    valid(val) {
      this.$emit("valid", val);
    },
  },
};
</script>