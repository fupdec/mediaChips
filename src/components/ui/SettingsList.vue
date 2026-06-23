<template>
  <v-container max-width="960" class="settings-list-container">
    <div class="settings-list">
      <slot/>
    </div>
  </v-container>
</template>

<style scoped>
.settings-list-container {
  padding-bottom: 16px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.settings-list > :slotted(*) {
  width: 100%;
}
</style>
