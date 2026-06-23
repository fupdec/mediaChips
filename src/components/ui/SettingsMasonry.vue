<template>
  <v-container fluid class="settings-masonry-container">
    <div class="settings-masonry">
      <slot/>
    </div>
  </v-container>
</template>

<style scoped>
.settings-masonry-container {
  max-width: min(100%, 2200px);
  margin-inline: auto;
  padding-bottom: 8px;
}

.settings-masonry {
  --settings-col-width: 420px;

  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  gap: 16px;
  margin-inline: auto;
}

.settings-masonry > :slotted(*) {
  flex: 0 1 var(--settings-col-width);
  width: min(100%, var(--settings-col-width));
  max-width: var(--settings-col-width);
}

@media (min-width: 960px) {
  .settings-masonry {
    --settings-col-width: 440px;
  }
}

@media (min-width: 1280px) {
  .settings-masonry {
    --settings-col-width: 480px;
  }
}

@media (min-width: 1800px) {
  .settings-masonry {
    --settings-col-width: 420px;
    gap: 14px;
  }
}

@media (min-width: 2200px) {
  .settings-masonry {
    --settings-col-width: 380px;
  }
}
</style>
