<template>
  <div class="d-flex align-center my-8 pagination-container">
    <v-pagination
      :model-value="page"
      @update:model-value="onPageChange"
      :length="Math.max(pages, 1)"
      :total-visible="totalVisible"
      active-color="primary"
      density="comfortable"
      rounded
    />

    <v-form
      v-if="pages > 4"
      @submit.prevent="emit('jump', jumpPage)"
    >
      <v-number-input
        :model-value="jumpPage"
        @update:model-value="value => emit('update:jumpPage', value)"
        @click:append-outer="emit('jump', jumpPage)"
        append-outer-icon="mdi-redo"
        :max="pages"
        :min="1"
        type="number"
        max-width="100px"
        min-width="100px"
        density="compact"
        variant="outlined"
        hide-details
        color="primary"
        control-variant="stacked"
      />
    </v-form>
  </div>
</template>

<script setup>
defineProps({
  page: {
    type: Number,
    required: true,
  },
  jumpPage: {
    type: Number,
    default: null,
  },
  pages: {
    type: Number,
    required: true,
  },
  totalVisible: {
    type: Number,
    default: 7,
  },
})

const emit = defineEmits(['update:page', 'update:jumpPage', 'change', 'jump'])

const onPageChange = (value) => {
  emit('update:page', value)
  emit('change', value)
}
</script>
