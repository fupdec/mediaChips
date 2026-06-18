<template>
  <v-dialog
    v-if="dialog"
    v-model="dialogLocal"
    :fullscreen="smAndDown"
    scrollable
    width="600"
  >
    <v-card>
      <DialogHeader
        @close="close"
        :header="t('playlists.new_playlist')"
        :buttons="buttons"
        closable
      />

      <v-form
        v-model="valid"
        ref="form"
        @submit.prevent
      >
        <v-card-text class="pa-4">
          <v-text-field
            v-model="name"
            :rules="[nameRules]"
            :placeholder="t('playlists.playlist_name')"
            variant="filled"
            autofocus
          ></v-text-field>
        </v-card-text>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script setup>
import {ref, computed, watch, defineEmits, defineProps} from 'vue';
import {useI18n} from 'vue-i18n';
import {useDisplay} from 'vuetify';
import {storeToRefs} from 'pinia';
import axios from 'axios';
import DialogHeader from '@/components/elements/DialogHeader.vue';
import {useAppStore} from '@/stores/app'; // Импортируем ваш Pinia store

const props = defineProps({
  dialog: Boolean,
});

const emit = defineEmits(['close', 'add']);

const {smAndDown} = useDisplay()
const appStore = useAppStore()
const {localhost: apiUrl} = storeToRefs(appStore);
const {t} = useI18n()

const dialogLocal = ref(props.dialog);
const name = ref('');
const valid = ref(false);
const form = ref(null);

const buttons = computed(() => [{
  icon: "plus",
  text: t('common.add'),
  color: "success",
  variant: "flat",
  action: () => {
    addPlaylist();
  },
}]);

// Следим за изменением props.dialog и синхронизируем с локальной переменной
watch(() => props.dialog, (newVal) => {
  dialogLocal.value = newVal;
});

// Следим за изменением dialogLocal и эмитим событие при закрытии
watch(dialogLocal, (newVal) => {
  if (!newVal) {
    close();
  }
});

const addPlaylist = () => {
  form.value?.validate();
  if (!valid.value) return;

  axios({
    method: "post",
    url: apiUrl.value + "/api/playlist/",
    data: {
      name: name.value,
    },
  })
    .then(() => {
      name.value = '';
      emit("add");
    })
    .catch((e) => {
      console.log(e);
    });
};

const nameRules = (value) => {
  return $readable.validateName(value)
};

const close = () => {
  emit("close");
};
</script>