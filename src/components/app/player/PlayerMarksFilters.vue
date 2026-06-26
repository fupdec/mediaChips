<template>
  <v-chip-group v-model="marksType" color="primary" column multiple>
    <v-chip value="favorite" size="small" variant="tonal" filter>
      <v-icon icon="mdi-heart" size="small" start/>
      {{ t('meta.default_names.favorite') }}
    </v-chip>
    <v-chip value="bookmark" size="small" variant="tonal" filter>
      <v-icon icon="mdi-bookmark" size="small" start/>
      {{ t('meta.default_names.bookmark') }}
    </v-chip>
    <v-chip
      v-for="i in assigned"
      :key="i.meta.id"
      :value="i.meta.id"
      size="small"
      variant="tonal"
      filter
      :prepend-icon="`mdi-${i.meta.icon}`"
      :text="i.meta.name"
    />
  </v-chip-group>
</template>

<script setup>
import {useI18n} from 'vue-i18n'

defineProps({
  assigned: {
    type: Array,
    default: () => [],
  },
})

const marksType = defineModel({
  type: Array,
  default: () => ['favorite', 'bookmark'],
})

const {t} = useI18n()
</script>
