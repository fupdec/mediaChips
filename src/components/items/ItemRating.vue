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
import axios from 'axios'
import { useAppStore } from '@/stores/app'
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

const appStore = useAppStore()
const itemsStore = useItemsStore()

const rating = ref(props.item.rating)

watch(rating, async (val) => {
  await axios.put(
    `${appStore.apiUrl}/api/${props.type}/${props.item.id}`,
    { rating: val }
  )

  await itemsStore.reload([props.item.id], props.type)
})
</script>
