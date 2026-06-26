<template>
  <v-checkbox
    v-model="item.favorite"
    @click.stop
    @update:model-value="setVal($event, 'favorite')"
    :false-value="0"
    :true-value="1"
    false-icon="mdi-heart-outline"
    true-icon="mdi-heart"
    color="pink"
    class="ma-0 pa-0 fav-btn"
    hide-details
    density="compact"
    dark
  />
</template>

<script setup>
import {apiClient} from '@/services/apiClient'
import { useItemsStore } from '@/stores/items'

// Определяем пропсы
const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true
  }
})

// Используем хранилища
const itemsStore = useItemsStore()

// Методы
const setVal = async (val, key) => {
  try {
    await apiClient.put(`/api/${props.type}/${props.item.id}`, {
      [key]: val,
    })

    // Обновляем элемент в хранилище Pinia
    itemsStore.updateItemField({
      id: props.item.id,
      field: key,
      value: val
    })
  } catch (error) {
    console.error('Error updating favorite:', error)
    // В случае ошибки отменяем изменение
    props.item.favorite = val === 1 ? 0 : 1
  }
}
</script>