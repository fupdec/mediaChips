<template>
  <div class="settings-list">
    <slot/>
  </div>
</template>

<style scoped>
.settings-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-list > :slotted(*) {
  width: 100%;
}
</style>
