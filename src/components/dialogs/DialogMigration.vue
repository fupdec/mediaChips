<template>
  <v-dialog v-model="dialog" persistent width="500">
    <v-card>
      <v-card-title primary-title>{{ $t('migration.title') }}</v-card-title>
      <v-card-text class="pa-2 pa-sm-4">
        <div v-if="step == 1" class="mb-4">
          <v-alert type="info" class="body-2" text dense>
            {{ $t('migration.old_data_found') }}
            <br>
            {{ $t('migration.data_destroyed_warning') }}
          </v-alert>

          <v-checkbox v-model="is_copy_backups" :label="$t('migration.copy_backups')"></v-checkbox>

          <v-btn @click="createBackupLowDb" color="success" class="mb-6" rounded depressed block>
            <v-icon left>mdi-transfer</v-icon>
            {{ $t('migration.start') }}
          </v-btn>

          <v-btn @click="showDialogDeleteConfirmation" color="error" rounded depressed block>
            <v-icon left>mdi-delete</v-icon>
            {{ $t('migration.remove_old_data_close') }}
          </v-btn>
        </div>

        <div v-if="step == 2 || step == 3">
          <v-alert type="warning" dense text class="body-2">
            {{ $t('migration.may_take_minutes') }}
            <br>
            {{ $t('migration.do_not_close') }}
          </v-alert>
          <div>{{ $t('migration.transferring_files') }}</div>
        </div>

        <div v-if="step == 4">
          <v-alert type="success" dense text class="body-2">
            {{ $t('migration.completed') }}
          </v-alert>
        </div>

        <div v-if="importStatus">{{ importStatus }}</div>

        <v-progress-linear
          v-if="step == 2 || step == 3"
          color="deep-purple accent-4"
          class="mt-2"
          indeterminate
          rounded
          height="6"
        ></v-progress-linear>
      </v-card-text>

      <v-card-actions v-if="step != 1" class="py-6">
        <v-spacer></v-spacer>
        <v-btn @click="finish" :disabled="step != 4" depressed rounded class="pr-4">
          <v-icon left>mdi-close</v-icon>
          {{ $t('common.close') }}
        </v-btn>
        <v-spacer></v-spacer>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import {apiClient} from "@/services/apiClient";

export default {
  name: "DialogMigration",
  data: () => ({
    dialog: true,
    step: 1,
    is_copy_backups: false,
    importStatus: "",
  }),
  computed: {
    isElectron() {
      return this.$store.state.isElectron;
    },
  },
  methods: {
    async showDialogDeleteConfirmation() {
      this.$store.state.Dialogs.confirm.text =
        this.$t('migration.data_lost_confirm');
      this.$store.state.Dialogs.confirm.action = async () =>
        await this.cleanLowDb();
      this.dialogDeleteConfirm = true;
    },
    async cleanLowDb() {
      this.$store.state.Operations.migrationLowDb.dialog = false;
      await apiClient.post("/api/Task/cleanLowDb")
    },
    async createBackupLowDb() {
      this.step = 2;
      await apiClient
        .post("/api/Task/createBackupLowDb", {
          is_copy_backups: this.is_copy_backups,
        })
        .then(async (res) => {
          await this.restoreBackup(res.data);
        })
        .catch((e) => {
          this.importStatus = e;
        });
    },
    async restoreBackup(backupName) {
      this.step = 3;

      await apiClient.post("/api/TasksBackups/restoreBackup", {
        name: backupName,
      }).then(() => {
        this.dialogRestoreFinished = true;
      });

      this.step = 4;
    },
    finish() {
      if (this.isElectron) {
        window.electronAPI.invoke("relaunch");
      } else {
        document.location.reload();
      }
    },
  },
};
</script>
