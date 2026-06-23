<template>
  <div class="duplicate-row">
    <v-tooltip :text="label" location="top">
      <template #activator="{ props: tooltipProps }">
        <v-icon
          v-bind="tooltipProps"
          :icon="icon"
          :color="color"
          size="14"
          class="duplicate-row__icon"
        />
      </template>
    </v-tooltip>
    <div class="duplicate-row__text text-caption">{{ path }}</div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  path: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss" scoped>
.duplicate-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;

  &__icon {
    flex-shrink: 0;
    margin-top: 1px;
  }

  &__text {
    min-width: 0;
    word-break: break-all;
    user-select: text;
  }
}
</style>
