<template>
  <div class="mx-4">
    <div class="tool-row mb-4">
        <v-btn
          @click="openFolder"
          color="primary"
          rounded
          variant="flat"
        >
          <v-icon icon="mdi-folder-open"
            start/>
          {{ t('settings_labels.tools.open_app_folder') }}
        </v-btn>

      <v-tooltip :text="t('settings_labels.tools.open_app_data_folder')">
        <template #activator="{ props }">
          <v-icon
            v-bind="props"
            class="ml-3 text-medium-emphasis"
            icon="mdi-help-circle-outline"
          />
        </template>
      </v-tooltip>
    </div>

    <ToolQuickAddTags class="mb-4"/>

    <div class="tool-row">
      <v-dialog
        v-model="dialog"
        :fullscreen="xs"
        :width="xl ? 1800 : 1200"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            @click="dialog = true"
            color="primary"
            rounded
            variant="flat"
          >
            <v-icon icon="mdi-find-replace"
              start/>
            {{ t('settings_labels.tools.bulk_edit_file_paths') }}
          </v-btn>
        </template>

        <v-card rounded="lg">
          <DialogHeader
            :header="t('settings_labels.tools.bulk_edit_paths')"
            :buttons="buttons"
            closable
            @close="dialog = false"
          />

          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model="query"
                  @keyup.enter="searchMedia"
                  @click:append="searchMedia"
                  append-inner-icon="mdi-magnify"
                  :placeholder="t('settings_labels.tools.search_for')"
                  :hint="t('settings_labels.tools.case_sensitive')"
                  variant="filled"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  v-model="replacement"
                  :placeholder="t('settings_labels.tools.update_with')"
                  :hint="t('settings_labels.tools.replacement_string')"
                  variant="filled"
                />
              </v-col>

              <v-col cols="12"
                v-if="files.length">
                <div class="text-center mb-2">
                  {{ t('settings_labels.tools.total_files', {count: files.length}) }}
                </div>

                <v-card variant="outlined">
                  <v-virtual-scroll
                    :items="files"
                    height="200"
                    item-height="22"
                  >
                    <template #default="{ item }">
                      <div class="path-string"
                        v-html="highlightPath(item.path)"/>
                      <v-divider/>
                    </template>
                  </v-virtual-scroll>
                </v-card>
              </v-col>

              <v-col cols="12"
                v-else
                class="text-center py-10">
                {{ t('settings_labels.tools.no_files_found') }}
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-tooltip :text="t('settings_labels.tools.replace_paths_hint')">
        <template #activator="{ props }">
          <v-icon
            v-bind="props"
            class="ml-3 text-medium-emphasis"
            icon="mdi-help-circle-outline"
          />
        </template>
      </v-tooltip>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import path from "path-browserify";
import {ref, computed} from "vue";
import {useI18n} from "vue-i18n";
import {useAppStore} from "@/stores/app";
import {useDialogsStore} from "@/stores/dialogs";
import {useDisplay} from "vuetify"
import DialogHeader from "@/components/elements/DialogHeader.vue";
import ToolQuickAddTags from "@/tools/ToolQuickAddTags.vue";

const store = useAppStore();
const dialogsStore = useDialogsStore();
const {xs, xl} = useDisplay();
const {t} = useI18n();

const dialog = ref(false);

const query = ref("");
const replacement = ref("");
const found = ref("");
const files = ref([]);

const apiUrl = computed(() => store.localhost);
const isElectron = computed(() => store.isElectron);

const buttons = computed(() => [
  {
    icon: "check",
    text: t("common.replace"),
    color: "success",
    function: () => replaceFiles(),
  },
]);

const searchMedia = async () => {
  try {
    const res = await axios.post(apiUrl.value + "/api/task/searchMediaByPath", {
      query: query.value,
    });

    found.value = query.value;
    files.value = res.data.filter((i) =>
      i.path.includes(query.value)
    );
  } catch (e) {
  }
};

const highlightPath = (filePath) => {
  if (!found.value) return filePath;

  const searchStr = found.value;
  const repl = replacement.value;

  const foundStr = filePath.replace(searchStr, `<b style="color:red">${searchStr}</b>`);
  const replacedStr = filePath.replace(searchStr, `<b style="color:blue">${repl}</b>`);

  return `${foundStr} <b>→</b> ${replacedStr}`;
};

const replaceFiles = async () => {
  const str = found.value;
  const repl = replacement.value;

  const replaced = files.value.map((i) => {
    const newPath = i.path.replace(str, repl);
    return {
      id: i.id,
      path: newPath,
      ext: path.extname(newPath),
      basename: path.basename(newPath),
      name: path.basename(newPath).replace(/\.[^/.]+$/, ""),
    };
  });

  dialogsStore.process.show = true;

  try {
    await axios.post(apiUrl.value + "/api/task/updateMediaMultiple", {
      mediaFiles: replaced,
    });

    query.value = "";
    replacement.value = "";
    found.value = "";
    files.value = [];

    dialog.value = false;
  } finally {
    dialogsStore.process.show = false;
  }
};

const openFolder = () => {
  if (!store.dbPath) return

  const folder = path.dirname(store.dbPath)

  $operable.openPath(folder, false)
};

</script>

<style scoped>
.tool-row {
  display: flex;
  align-items: center;
}

.path-string {
  white-space: nowrap;
  font-size: 14px;
}
</style>
