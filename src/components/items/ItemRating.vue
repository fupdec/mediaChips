<template>
  <v-rating
    v-model="rating"
    active-color="yellow-darken-2"
    color="#eee"
    class="rating"
    empty-icon="mdi-star-outline"
    half-icon="mdi-star-half-full"
    density="compact"
    half-increments
    hover
    clearable
  />
</template>

<script setup>
import { ref, watch } from 'vue'
import {apiClient} from '@/services/apiClient'
import { useItemsStore } from '@/stores/items'

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
})

const itemsStore = useItemsStore()

const rating = ref(props.item.rating)

watch(rating, async (val) => {
  await apiClient.put(`/api/${props.type}/${props.item.id}`, { rating: val })

  await itemsStore.reload([props.item.id], props.type)
})
</script>
