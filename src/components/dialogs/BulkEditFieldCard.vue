<template>
  <v-card
    class="bulk-field-card rounded-xl pa-4"
    :class="fieldCardClass"
    color="rgba(150, 150, 150, 0.09)"
    variant="flat"
  >
    <div class="bulk-field-card__header">
      <v-btn
        @click="$emit('toggle-mode')"
        :key="`${field.key}_${refreshKey}`"
        size="small"
        variant="tonal"
        :color="editMode.color"
        icon
      >
        <v-icon :icon="editMode.icon" size="20"/>
      </v-btn>

      <div class="bulk-field-card__title flex-grow-1 min-width-0">
        <div class="d-flex align-center flex-wrap ga-2">
          <v-icon
            v-if="showIcons && field.icon"
            :icon="`mdi-${field.icon}`"
            size="18"
            class="text-medium-emphasis"
          />
          <span class="text-subtitle-2 font-weight-medium text-truncate">
            {{ field.name }}
          </span>
          <v-chip
            :color="editMode.color"
            variant="tonal"
            size="x-small"
          >
            {{ editMode.label }}
          </v-chip>
        </div>
        <div v-if="field.hint" class="text-caption text-medium-emphasis mt-1">
          {{ field.hint }}
        </div>
      </div>
    </div>

    <div
      class="bulk-field-card__body"
      :class="{'bulk-field-card__body--disabled': disabled}"
    >
      <MetaInputArray
        v-if="field.type === 'array'"
        @update:model-value="$emit('update:value', $event)"
        :model-value="value"
        :meta-id="field.key"
        :disabled="disabled"
        purpose="bulk"
        variant="filled"
        hide-details="auto"
        multiple
      />

      <v-text-field
        v-else-if="field.type === 'number'"
        :model-value="value"
        @update:model-value="$emit('update:value', $event)"
        :label="field.name"
        :prepend-icon="showIcons ? `mdi-${field.icon}` : ''"
        :disabled="disabled"
        type="number"
        hide-details="auto"
        clearable
        variant="filled"
      />

      <v-text-field
        v-else-if="field.type === 'string'"
        :model-value="value"
        @update:model-value="$emit('update:value', $event)"
        :label="field.name"
        :prepend-icon="showIcons ? `mdi-${field.icon}` : ''"
        :disabled="disabled"
        hide-details="auto"
        clearable
        variant="filled"
      />

      <v-checkbox
        v-else-if="field.type === 'boolean'"
        :model-value="value"
        @update:model-value="$emit('update:value', $event)"
        :label="field.name"
        :prepend-icon="showIcons ? `mdi-${field.icon}` : ''"
        :disabled="disabled"
        hide-details
        density="compact"
      />

      <v-text-field
        v-else-if="field.type === 'date'"
        @click="$emit('pick-date')"
        @click:clear="$emit('clear-date')"
        :model-value="value"
        :label="field.name"
        :prepend-icon="showIcons ? `mdi-${field.icon}` : ''"
        :disabled="disabled"
        hide-details="auto"
        readonly
        clearable
        variant="filled"
      />

      <div v-else-if="field.type === 'rating'" class="d-flex align-center pt-1">
        <v-rating
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :length="field.meta?.ratingMax"
          :full-icon="`mdi-${field.meta?.ratingIcon}`"
          :empty-icon="`mdi-${field.meta?.ratingIconEmpty || field.meta?.ratingIcon}`"
          :half-increments="field.meta?.ratingHalf"
          :half-icon="`mdi-${field.meta?.ratingIconHalf || field.meta?.ratingIcon}`"
          :color="field.meta?.ratingColor"
          :readonly="disabled"
          background-color="grey"
          density="compact"
          clearable
          hover
        />
      </div>

      <div v-else-if="field.type === 'preset-rating'" class="d-flex align-center pt-1">
        <v-rating
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          color="yellow-darken-3"
          background-color="grey-darken-1"
          empty-icon="mdi-star-outline"
          half-icon="mdi-star-half-full"
          half-increments
          :readonly="disabled"
          density="compact"
          clearable
          hover
        />
      </div>

      <div v-else-if="field.type === 'preset-favorite'" class="d-flex align-center pt-1">
        <v-checkbox
          :model-value="value"
          @update:model-value="$emit('update:value', $event)"
          :false-value="0"
          :true-value="1"
          false-icon="mdi-heart-outline"
          true-icon="mdi-heart"
          color="pink"
          :disabled="disabled"
          hide-details
          density="compact"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup>
import {computed} from 'vue'
import MetaInputArray from '@/components/meta/input/MetaInputArray.vue'

const props = defineProps({
  field: {
    type: Object,
    required: true,
  },
  editType: {
    type: Number,
    default: 0,
  },
  editMode: {
    type: Object,
    required: true,
  },
  value: {
    default: null,
  },
  showIcons: Boolean,
  disabled: Boolean,
  refreshKey: {
    type: [Number, String],
    default: 0,
  },
})

defineEmits(['toggle-mode', 'update:value', 'pick-date', 'clear-date'])

const fieldCardClass = computed(() => ({
  'bulk-field-card--keep': props.editType === 0,
  'bulk-field-card--delete': props.editType === 1,
  'bulk-field-card--replace': props.editType === 2,
  'bulk-field-card--add': props.editType === 3,
}))
</script>

<style scoped>
.bulk-field-card {
  height: 100%;
  transition: box-shadow 0.2s ease;
}

.bulk-field-card--delete {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-error));
}

.bulk-field-card--replace {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-warning));
}

.bulk-field-card--add {
  box-shadow: inset 3px 0 0 rgb(var(--v-theme-success));
}

.bulk-field-card--keep {
  opacity: 0.92;
}

.bulk-field-card__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
}

.bulk-field-card__title {
  min-width: 0;
}

.bulk-field-card__body--disabled {
  opacity: 0.55;
  pointer-events: none;
}

.bulk-field-card__body :deep(.v-field) {
  border-radius: 12px;
}
</style>
