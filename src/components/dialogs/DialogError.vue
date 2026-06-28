<template>
  <v-dialog
    v-model="dialogsStore.error.show"
    @input="dialogsStore.error.show = false"
    width="400"
    scrollable
    persistent
  >
    <v-card>
      <v-card-text class="text-center">
        <v-icon size="large" color="error" class="py-6">mdi-alert-octagon</v-icon>
        <div
          class="text-error"
          style="overflow: hidden; text-overflow: ellipsis"
          v-html="dialogsStore.error.text"
        ></div>
      </v-card-text>
      <v-card-actions class="pb-4">
        <v-spacer></v-spacer>
        <v-btn @click="dialogsStore.error.show = false" class="pr-4" variant="text">
          <v-icon icon="mdi-close" class="mr-1"></v-icon> {{ t('common.close') }}
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDialogsStore } from '@/stores/dialogs'
import {useI18n} from 'vue-i18n'

const dialogsStore = useDialogsStore()
const {t} = useI18n()
</script>