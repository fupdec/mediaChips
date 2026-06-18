<template>
  <v-dialog v-if="dialog" @input="close" :value="dialog" width="800" scrollable>
    <v-card>
      <DialogHeader @close="close" :header="$t('items.scrape_info')" closable />

      <v-progress-linear
        v-if="progress < 99"
        :value="progress"
      ></v-progress-linear>
      <v-card-text>
        <div v-for="i in performers" :key="i.performer.id">
          {{ i.performer.name }}
          <ScraperDataTransfer :selected="i.result"></ScraperDataTransfer>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import DialogHeader from "@/components/elements/DialogHeader.vue";

export default {
  name: "DialogScraper",
  components: {
    DialogHeader,
    ScraperDataTransfer: () =>
      import("@/components/scraper/ScraperDataTransfer.vue"),
  },
  data: () => ({
    dialog: false,
  }),
  computed: {
    performers() {
      return this.$store.state.Dialogs.scraperMultiple.performers;
    },
    progress() {
      return this.$store.state.Dialogs.scraperMultiple.progress;
    },
  },
  methods: {
    close() {
      this.$store.state.Dialogs.scraperMultiple.show = false;
    },
  },
  mounted() {
    this.dialog = true;
  },
};
</script>
