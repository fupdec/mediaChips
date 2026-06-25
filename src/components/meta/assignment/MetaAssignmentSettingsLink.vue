<template>
  <v-btn
    variant="text"
    size="small"
    color="primary"
    class="meta-assignment-settings-link px-1"
    :to="link"
  >
    <v-icon start size="16">mdi-open-in-new</v-icon>
    {{ t('settings_labels.field_pinning.open_in_settings') }}
  </v-btn>
</template>

<script setup>
import {computed} from 'vue'
import {useI18n} from 'vue-i18n'

const props = defineProps({
  view: {
    type: String,
    default: 'media',
    validator: (v) => ['media', 'tags'].includes(v),
  },
  mediaTypeId: {type: Number, default: null},
  metaId: {type: Number, default: null},
})

const {t} = useI18n()

const link = computed(() => {
  const query = {tab: 'library', view: props.view}
  if (props.mediaTypeId) query.mediaTypeId = props.mediaTypeId
  if (props.metaId) query.metaId = props.metaId
  return {path: '/settings', query}
})
</script>
