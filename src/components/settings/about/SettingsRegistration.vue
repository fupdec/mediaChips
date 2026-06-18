<template>
  <div class="mx-4">
    <v-table class="mb-4">
      <tbody>
      <tr>
        <td>{{ t('registration.status') }}</td>
        <td>
          <v-chip :color="reg ? 'success' : 'error'" variant="tonal" label>
            <span>{{ reg ? t('registration.application_registered') : t('registration.application_not_registered') }}</span>
          </v-chip>
        </td>
      </tr>
      <tr v-if="regInfo.license_code">
        <td>{{ t('registration.activation_key') }}</td>
        <td><b>{{ regInfo.license_code || "??" }}</b></td>
      </tr>
      <tr v-if="regInfo.license_code">
        <td>{{ t('registration.used_devices') }}</td>
        <td><b>{{ activated_devices }} / 3</b></td>
      </tr>
      <tr v-if="regInfo.license_code">
        <td>{{ t('registration.expiration_date') }}</td>
        <td><b>{{ regInfo.license_expiry || "??" }}</b></td>
      </tr>
      </tbody>
    </v-table>

    <div class="mb-4">
      <v-btn @click="openDialog" color="primary" rounded variant="flat">
        <v-icon start>mdi-key</v-icon>
        {{ t('registration.enter_activation_key') }}
      </v-btn>
    </div>

    <div v-if="reg" class="mb-4">
      <v-btn
        @click="dialogDeactivateConfirm = true"
        color="error"
        rounded
        variant="flat"
        dark
      >
        <v-icon start>mdi-cancel</v-icon>
        <span>{{ t('registration.deactivate_on_device') }}</span>
      </v-btn>
    </div>

    <div v-if="regInfo.license_type !== 'Lifetime'" class="mb-4">
      <v-btn
        @click="openLink('https://mediachips.app/')"
        color="primary"
        rounded
        variant="flat"
      >
        <v-icon start>mdi-cart</v-icon>
        {{ t('registration.buy_lifetime_key') }}
      </v-btn>
    </div>

    <v-dialog
      v-model="dialog"
      scrollable
      persistent
      width="800"
    >
      <v-stepper
        v-model="step"
        rounded="lg"
      >
        <v-stepper-header>
          <!-- STEPS HEADER -->
          <v-stepper-item
            :value="1"
            :complete="step > 1"
            :error="!!checkingStatus"
            :title="t('registration.entering_key')"
            color="primary"
          ></v-stepper-item>

          <v-divider></v-divider>

          <v-stepper-item
            :value="2"
            :complete="step > 1 && (numberOfActivations < 3 || !isKeyExpired)"
            :error="numberOfActivations > 2 || isKeyExpired"
            :title="t('registration.key_status')"
            color="primary"
          ></v-stepper-item>

          <v-divider></v-divider>

          <v-stepper-item
            :value="3"
            :complete="step == 3"
            :title="t('registration.registration')"
            color="primary"
          ></v-stepper-item>

        </v-stepper-header>

        <!--  STEPS ITEMS  -->
        <v-stepper-window class="ma-0">
          <v-stepper-window-item :value="1" class="pa-0">

            <!-- 1 STEP : ENTER -->
            <v-card :loading="isQueryRun">
              <template v-slot:loader="{ isActive }">
                <v-progress-linear
                  :active="isActive"
                  color="primary"
                  height="4"
                  indeterminate
                ></v-progress-linear>
              </template>

              <v-card-text class="text-center pt-6">
                <v-form
                  v-model="valid"
                  @submit.prevent
                  ref="form"
                  class="d-flex"
                >
                  <v-text-field
                    v-model="licenseKey"
                    @keyup.enter="checkLicenseKey"
                    :rules="[(value) => !!value || t('registration.key_required')]"
                    hint="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
                    color="primary"
                    :label="t('registration.activation_key')"
                    variant="filled"
                    autofocus
                  />
                </v-form>

                <v-alert
                  type="error"
                  :model-value="checkingStatus.length != 0"
                  density="compact"
                  variant="tonal"
                  rounded="xl"
                  closable
                >
                  {{ checkingStatus }}
                </v-alert>
              </v-card-text>

              <v-card-actions>
                <v-btn @click="dialog = false" class="ma-2 pr-4" variant="text" rounded>
                  <v-icon start>mdi-close</v-icon>
                  {{ t('common.cancel') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  @click="checkLicenseKey"
                  :disabled="isQueryRun"
                  color="primary"
                  class="ma-2 px-4"
                  rounded
                  variant="flat"
                >
                  <v-icon start>mdi-key-variant</v-icon>
                  {{ t('registration.check_key_status') }}
                  <v-icon size="large" end>mdi-chevron-right</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>

          <!-- 2 STEP : CONFIRM -->

          <v-stepper-window-item :value="2" class="pa-0">
            <v-card :loading="isQueryRun" :disabled="isQueryRun">
              <template v-slot:loader="{ isActive }">
                <v-progress-linear
                  :active="isActive"
                  color="primary"
                  height="4"
                  indeterminate
                ></v-progress-linear>
              </template>

              <v-card-text class="text-body-1 pt-8">
                <v-table>
                  <tbody>
                  <tr>
                    <td>{{ t('registration.key') }}</td>
                    <td><b>{{ licenseKey }}</b></td>
                    <td>
                      <v-icon color="success">mdi-check</v-icon>
                    </td>
                  </tr>
                  <tr>
                    <td>{{ t('registration.used_devices') }}</td>
                    <td><b>{{ numberOfActivations }} / 3</b></td>
                    <td>
                      <v-icon v-if="numberOfActivations < 3" color="success">mdi-check</v-icon>
                      <v-icon v-else color="error">mdi-close</v-icon>
                    </td>
                  </tr>
                  <tr>
                    <td>{{ t('registration.expiration_date') }}</td>
                    <td><b>{{ licenseExpiryDate }}</b></td>
                    <td>
                      <v-icon v-if="isKeyExpired" color="error">mdi-close</v-icon>
                      <v-icon v-else color="success">mdi-check</v-icon>
                    </td>
                  </tr>
                  </tbody>
                </v-table>

                <v-alert
                  v-if="numberOfActivations > 2 || isKeyExpired"
                  class="mt-4"
                  color="error"
                  rounded="xl"
                  variant="tonal"
                >
                  <div v-if="numberOfActivations > 2">
                    {{ t('registration.activations_exceeded') }}
                  </div>
                  <div v-if="isKeyExpired">{{ t('registration.key_expired') }}</div>
                  <div v-if="numberOfActivations > 2 || isKeyExpired">
                    {{ t('registration.enter_another_key') }}
                  </div>
                </v-alert>
              </v-card-text>
              <v-card-actions>
                <v-btn @click="closeDialog" class="ma-2 pr-4" text rounded>
                  <v-icon start>mdi-close</v-icon>
                  {{ t('common.cancel') }}
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn @click="step = 1" class="ma-2 pr-4" text rounded>
                  <v-icon size="large" start>mdi-chevron-left</v-icon>
                  <span>{{ t('registration.back_to_entering_key') }}</span>
                </v-btn>
                <v-btn
                  @click="register"
                  color="primary"
                  class="ma-2 px-4"
                  :disabled="
                    numberOfActivations > 2 || isQueryRun || isKeyExpired
                  "
                  rounded
                  variant="flat"
                >
                  <v-icon start>mdi-key-variant</v-icon>
                  {{ t('registration.register_app') }}
                  <v-icon size="large" end>mdi-chevron-right</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>

          <!-- 3 STEP : FINAL -->

          <v-stepper-window-item :value="3" class="pa-0">
            <v-card :loading="isQueryRun" class="pt-4">
              <v-card-text class="text-center text-body-1">
                <div>{{ registrationStatus }}</div>
              </v-card-text>
              <v-card-actions class="pa-4">
                <v-spacer></v-spacer>
                <v-btn
                  @click="closeDialog"
                  color="primary"
                  variant="flat"
                  class="px-4"
                  rounded
                >
                  {{ t('common.ok') }}
                </v-btn>
                <v-spacer></v-spacer>
              </v-card-actions>
            </v-card>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-dialog>

    <DialogConfirm
      v-if="dialogDeactivateConfirm"
      @close="dialogDeactivateConfirm = false"
      @confirm="deactivateKey"
      :dialog="dialogDeactivateConfirm"
      :text="t('registration.deactivate_confirm')"
    />
  </div>
</template>

<script setup>
import {ref, computed, onMounted} from 'vue'
import {useI18n} from 'vue-i18n'
import {useRegistrationStore} from '@/stores/registration'
import {useNotificationsStore} from '@/stores/notifications'
import DialogConfirm from '@/components/dialogs/DialogConfirm.vue'

// Инициализация хранилищ
const registrationStore = useRegistrationStore()
const notificationsStore = useNotificationsStore()
const {t} = useI18n()

// Локальные реактивные переменные
const dialog = ref(false)
const dialogDeactivateConfirm = ref(false)
const step = ref(1)
const licenseKey = ref('')
const valid = ref(false)
const isQueryRun = ref(false)
const numberOfActivations = ref(null)
const licenseExpiryDate = ref('')
const isKeyExpired = ref(false)
const checkingStatus = ref('')
const registrationStatus = ref('')
const activated_devices = ref(0)

const cleanObj = {
  license_code: '',
  license_created: '',
  license_expiry: '',
  license_type: '',
  client_email: '',
  client_name: '',
  fingerprint_1: '',
  fingerprint_2: '',
  fingerprint_3: ''
}

// Вычисляемые свойства
const regInfo = computed(() => registrationStore.regInfo)
const reg = computed(() => registrationStore.reg)

// Ссылка на форму
const form = ref(null)

// Методы
const openDialog = () => {
  step.value = 1
  licenseKey.value = regInfo.value.license_code || ''
  dialog.value = true
  checkingStatus.value = ''
}

const closeDialog = () => {
  dialog.value = false
  checkingStatus.value = ''
  setTimeout(() => {
    step.value = 1
  }, 1000)
}

const openLink = (link) => {
  window.open(link, '_blank')
}

const calculateActivations = (data) =>{
  const fingerprints = [
    data.fingerprint_1,
    data.fingerprint_2,
    data.fingerprint_3
  ]

  let numberOfActivationsCount = 0
  for (let i = 0; i < fingerprints.length; i++) {
    if (fingerprints[i] && fingerprints[i].length > 0) {
      ++numberOfActivationsCount
    }
  }

  // if (fingerprints.includes(registrationStore.machineId)) {
  //   ++numberOfActivationsCount
  // }

  return numberOfActivationsCount
}

const checkLicenseKey = async () => {
  if (!valid.value) return

  isQueryRun.value = true

  try {
    const data = await registrationStore.checkLicense(licenseKey.value)

    if (data) {
      numberOfActivations.value = calculateActivations(data)

      const today = new Date().toISOString().substring(0, 10)
      isKeyExpired.value = today > data.license_expiry && data.license_expiry !== '0000-00-00'

      licenseExpiryDate.value = data.license_expiry
      step.value = 2
      checkingStatus.value = ''
    } else {
      checkingStatus.value = t('registration.key_not_found', {key: licenseKey.value})
    }
  } catch (error) {
    checkingStatus.value = error.message
    notificationsStore.setNotification({
      type: 'error',
      text: t('registration.internet_error_checking_key')
    })
  } finally {
    isQueryRun.value = false
  }
}

const register = async () => {
  isQueryRun.value = true

  try {
    const data = await registrationStore.activateLicense(licenseKey.value)

    if (data && data.activated) {
      registrationStatus.value = data.message

      try {
        // Обновляем информацию о регистрации в хранилище
        await registrationStore.updateRegInfo(data.license)
        registrationStatus.value = t('registration.registration_successful')
      } catch (encryptError) {
        console.error('Registration save error:', encryptError)
        registrationStatus.value = t('registration.registration_failed')
      }

      step.value = 3
    } else {
      registrationStatus.value = data?.message || t('registration.registration_failed')
    }
  } catch (error) {
    registrationStatus.value = error.message

    notificationsStore.setNotification({
      type: 'error',
      text: error.message
    })
  } finally {
    isQueryRun.value = false
  }
}

const deactivateKey = async () => {
  dialogDeactivateConfirm.value = false

  if (!regInfo.value.license_code) {
    notificationsStore.setNotification({
      type: 'error',
      text: t('registration.no_activation_key_found')
    })
    return
  }

  try {
    const data = await registrationStore.deactivateLicense(regInfo.value.license_code)

    if (data.success) {
      notificationsStore.setNotification({
        type: 'info',
        text: data.message
      })
      licenseKey.value = ''

      // Очищаем информацию о регистрации
      await registrationStore.updateRegInfo(cleanObj)
    } else {
      notificationsStore.setNotification({
        type: 'error',
        text: data.message || t('registration.deactivation_failed')
      })
    }
  } catch (error) {
    notificationsStore.setNotification({
      type: 'error',
      text: error.message
    })
  }
}

// Инициализация при монтировании
onMounted(() => {
  // Проверяем, есть ли сохраненная регистрационная информация
  if (regInfo.value) {
    activated_devices.value = calculateActivations(regInfo.value)
  }
})
</script>

<style scoped>
.user-select {
  user-select: text;
  -webkit-user-select: text;
}
</style>