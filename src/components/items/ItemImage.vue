<template>
  <v-lazy>
    <v-card
      :disabled="!reg && x > 14"
      @contextmenu.stop="showMenu"
      @mousedown="stopSmoothScroll($event)"
      v-ripple="{ class: 'text-primary' }"
      :class="{ favorite: media.favorite }"
      class="media-card meta-card"
      outlined
      hover
    >
      <v-img @click="openPath(media.path)" :src="thumb" class="thumb">
        <div v-if="!reg && x > 14" class="reg-block">
          <div>App not registered</div>
        </div>

        <v-rating
          :value="media.rating"
          @input="setVal($event, 'rating')"
          color="yellow darken-2"
          background-color="#eee"
          class="rating"
          empty-icon="mdi-star-outline"
          half-icon="mdi-star-half-full"
          dense
          half-increments
          hover
          clearable
        />

        <v-checkbox
          v-model="media.favorite"
          @change="setVal($event, 'favorite')"
          :false-value="0"
          :true-value="1"
          off-icon="mdi-heart-outline"
          on-icon="mdi-heart"
          color="pink"
          class="ma-0 pa-0 fav-btn"
          hide-details
          dark
        />

        <v-btn @click.stop="edit" color="primary" class="btn-edit" small fab>
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
      </v-img>

      <div class="description">
        <div class="media-card-title">
          <v-icon
            v-if="!isFileExists"
            title="File not found"
            color="error"
            left
          >
            mdi-file-alert
          </v-icon>
          <span v-text="fileName" :title="fileName" />
        </div>

        <PinnedMeta
          :tag="media"
          :tags="tags"
          :values="values"
          :metadata="nestedMetadata"
          type="image"
        />
      </div>

      <v-icon
        v-if="media.bookmark"
        class="bookmark"
        color="red"
        :title="media.bookmark"
        v-html="'mdi-bookmark'"
      />

      <v-overlay
        v-if="ITEMS.isSelect"
        @click.stop="toggleSelect"
        :color="isSelected ? 'primary' : '#7777'"
        z-index="1"
        absolute
      >
        <v-icon v-if="isSelected" size="50">
          mdi-checkbox-marked-outline
        </v-icon>
      </v-overlay>
    </v-card>
  </v-lazy>
</template>

<script>
import Vue from "vue";
import axios from "axios";
import PinnedMeta from "@/components/items/ItemPinnedMeta.vue";

export default {
  name: "ItemImage",
  props: {
    media: Object,
    reg: Boolean,
    upd: Array,
    x: Number,
  },
  components: {
    PinnedMeta,
  },
  async beforeMount() {
    await this.getTags();
    await this.getValues();
    await this.getImg();
    await this.checkFileExists();
  },
  data: () => ({
    tags: [],
    values: [],
    thumb: null,
    isFileExists: true,
  }),
  computed: {
    apiUrl() {
      return this.$store.state.localhost;
    },
    fileName() {
      return Vue.prototype.$getFileNameFromPath(this.media.path);
    },
    ITEMS() {
      return this.$store.state.Items;
    },
    nestedMetadata() {
      return {
        filesize: Vue.prototype.$getReadableFileSize(this.media.filesize),
        fileExtension: Vue.prototype.$getFileExtensionFromPath(this.media.path),
      };
    },
  },
  methods: {
    async getImg() {
      this.thumb = await Vue.prototype.$getLocalImage(this.media.path, true);
    },
    getTags() {
      let url = `/api/TagsInMedia?mediaId=${this.media.id}`;
      axios
        .get(this.apiUrl + url)
        .then((res) => {
          this.tags = res.data;
        })
        .catch((e) => {
          console.log(e);
        });
    },
    getValues() {
      let url = `/api/ValuesInMedia?mediaId=${this.media.id}`;
      axios
        .get(this.apiUrl + url)
        .then((res) => {
          this.values = res.data;
        })
        .catch((e) => {
          console.log(e);
        });
    },
    edit() {
      this.$store.state.Dialogs.mediaEditing.show = true;
      this.$store.state.Dialogs.mediaEditing.media = this.media;
    },
    async checkFileExists() {
      let res = await Vue.prototype.$checkFileExists(this.media.path);
      this.isFileExists = res.status == 201;
    },
    async setVal(val, key) {
      await axios({
        method: "put",
        url: this.apiUrl + "/api/media/" + this.media.id,
        data: {
          [key]: val,
        },
      });
      this.$root.$emit("getItemsFromDb", {
        ids: [],
        type: 'media',
      });
    },
    showMenu(e) {
      e.preventDefault();
      let contextMenu = [];
      contextMenu.push({
        name: `Edit`,
        type: "item",
        icon: "pencil",
        action: () => {
          this.edit();
        },
      });
      contextMenu.push({ type: "divider" });
      if (!this.ITEMS.isSelect)
        contextMenu.push({
          name: `Open File`,
          type: "item",
          icon: "file",
          disabled: !this.isFileExists,
          action: () => {
            this.openPath(this.media.path);
          },
        });
      if (!this.ITEMS.isSelect)
        contextMenu.push({
          name: `Open file folder`,
          type: "item",
          icon: "folder-open",
          disabled: !this.isFileExists,
          action: () => {
            this.openPath(this.media.path, true);
          },
        });
      contextMenu.push({ type: "divider" });
      contextMenu.push({
        name: `Delete`,
        type: "item",
        icon: "delete",
        color: "red",
        action: () => {
          this.dialogDeleting = true;
        },
      });
      this.$store.dispatch("showContextMenu", {
        x: e.clientX,
        y: e.clientY,
        content: contextMenu,
      });
    },
    openPath(entryPath, isDir) {
      if (!this.isFileExists) return;
      Vue.prototype.$openPath(entryPath, isDir);
    },
  },
  watch: {
    upd(arr) {
      if (arr.includes(this.media.id)) {
        this.getTags();
        this.getValues();
      }
    },
  },
};
</script>