<template>
  <draggable class="drag-area" tag="ul" :list="nested" :group="{name:'g1'}">
    <li v-for="card in nested" :key="card.id" 
      :style="`background-color:${getCard(card.id).meta.color||'#777'}`"
      @mouseover.stop="showImage($event, card.id, 'meta', meta.id)" 
      @mouseleave.stop="$store.state.hoveredImage=false"
    > 
      <div class="card-name">{{getCard(card.id).meta.name}}
        <span v-if="card.nested.length" class="ml-4">{{card.nested.length}}</span>
      </div>
      <NestedMetaCard :nested="card.nested"/>
    </li>
  </draggable>
</template>

<script>
import draggable from 'vuedraggable'
import MetaGetters from '@/mixins/MetaGetters'
import ShowImageFunction from '@/mixins/ShowImageFunction'

export default {
  props: {
    nested: {
      required: true,
      type: Array
    }
  },
  components: { draggable },
  name: "NestedMetaCard",
  mixins: [ShowImageFunction,MetaGetters],
}
</script>