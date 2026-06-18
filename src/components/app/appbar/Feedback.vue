<template>
  <v-tooltip location="bottom">
    <template #activator="{ props }">
      <v-btn
        v-bind="props"
        icon
        @click="dialogsStore.feedback = true"
      >
        <v-icon>mdi-message-text-outline</v-icon>
      </v-btn>
    </template>
    <span>{{ t("appbar.feedback") }}</span>
  </v-tooltip>
</template>

<script setup>
import {useI18n} from "vue-i18n"
import {useDialogsStore} from "@/stores/dialogs"

const dialogsStore = useDialogsStore()
const {t} = useI18n()
</script>
