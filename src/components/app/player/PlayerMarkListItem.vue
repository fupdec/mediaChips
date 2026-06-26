<template>
  <div
    @click="jumpTo(mark.time)"
    class="mark-item"
  >
    <div class="mark-item__thumb-wrap">
      <v-img
        v-if="isThumbsLoaded"
        :src="mark.thumb"
        :aspect-ratio="16 / 9"
        class="mark-item__thumb"
        cover
      />
      <v-skeleton-loader v-else type="image" class="mark-item__thumb"/>
    </div>

    <div class="mark-item__info">
      <div class="mark-item__label">
        <v-icon :color="getColor(mark)" size="x-small" class="mr-1">mdi-{{ getIcon(mark) }}</v-icon>
        <span
          v-if="mark.type == 'meta'"
          class="mark-item__name"
          v-html="mark['tag.name'] || mark.tag?.name"
        />
        <span
          v-else-if="mark.text"
          class="mark-item__name"
          v-html="mark.text"
          :title="mark.text"
        />
        <span v-else class="mark-item__name" v-html="mark.name"/>
      </div>
      <span class="mark-item__time">
        {{ getDuration(mark.time) }}<template v-if="mark.end"> – {{ getDuration(mark.end) }}</template>
      </span>
    </div>

    <v-btn
      @click.stop="remove(mark)"
      class="mark-item__delete"
      variant="text"
      color="error"
      size="x-small"
      icon
    >
      <v-icon size="small">mdi-delete-outline</v-icon>
    </v-btn>
  </div>
</template>

<script setup>
defineProps({
  mark: {
    type: Object,
    required: true,
  },
  isThumbsLoaded: {
    type: Boolean,
    default: false,
  },
  getIcon: {
    type: Function,
    required: true,
  },
  getColor: {
    type: Function,
    required: true,
  },
  getDuration: {
    type: Function,
    required: true,
  },
  jumpTo: {
    type: Function,
    required: true,
  },
  remove: {
    type: Function,
    required: true,
  },
})
</script>
