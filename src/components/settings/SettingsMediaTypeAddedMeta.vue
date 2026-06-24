<template>
  <div>
    <div class="d-flex justify-end mb-2">
      <MetaAssignmentSettingsLink
        v-if="mediaType?.id"
        view="media"
        :media-type-id="mediaType.id"
      />
    </div>

    <MetaAssignmentPanel
      mode="from-media-type"
      :media-type="mediaType"
      @meta-updated="$emit('meta-updated', $event)"
    />
  </div>
</template>

<script setup>
import MetaAssignmentPanel from '@/components/meta/assignment/MetaAssignmentPanel.vue'
import MetaAssignmentSettingsLink from '@/components/meta/assignment/MetaAssignmentSettingsLink.vue'

defineProps({
  mediaType: {
    type: Object,
    required: true,
  },
})

defineEmits(['meta-updated'])
</script>
