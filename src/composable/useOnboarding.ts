import { useAppStore } from '@/stores/app'
import { useDialogsStore } from '@/stores/dialogs'
import { useSettingsStore } from '@/stores/settings'
import { setOption } from '@/services/settingsService'

export function shouldShowOnboarding(isPlayerWindow: boolean): boolean {
  if (isPlayerWindow) return false

  const settings = useSettingsStore()
  const app = useAppStore()

  if (app.isLocked) return false

  return settings.onboardingCompleted !== '1'
}

export function openOnboardingIfNeeded(isPlayerWindow: boolean): void {
  if (!shouldShowOnboarding(isPlayerWindow)) return

  useDialogsStore().onboarding.show = true
}

export async function completeOnboarding(): Promise<void> {
  useDialogsStore().onboarding.show = false
  await setOption('1', 'onboardingCompleted')
}

export async function skipOnboarding(): Promise<void> {
  await completeOnboarding()
}
