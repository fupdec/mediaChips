<template>
  <div>
    <div class="d-flex justify-end mb-2">
      <MetaAssignmentSettingsLink
        v-if="meta?.id"
        :view="meta.type === 'array' ? 'tags' : 'media'"
        :meta-id="meta.id"
      />
    </div>

    <MetaAssignmentPanel
      mode="from-meta"
      :meta="meta"
      @pinned-meta-updated="$emit('pinned-meta-updated')"
      @pinned-media-updated="$emit('pinned-media-updated')"
    />
  </div>
</template>

<script setup>
import MetaAssignmentPanel from '@/components/meta/assignment/MetaAssignmentPanel.vue'
import MetaAssignmentSettingsLink from '@/components/meta/assignment/MetaAssignmentSettingsLink.vue'

defineProps({
  meta: {
    type: Object,
    required: true,
  },
})

defineEmits(['pinned-meta-updated', 'pinned-media-updated'])
</script>
