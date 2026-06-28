import type { InjectionKey } from 'vue'
import type { usePlayerTransport } from '@/composable/usePlayerTransport'
import type { PlayerTransportEmit } from '@/types/player'

export type { PlayerTransportEmit } from '@/types/player'

export type PlayerTransportContext = ReturnType<typeof usePlayerTransport> & {
  emit: PlayerTransportEmit
}

export const PLAYER_TRANSPORT_KEY: InjectionKey<PlayerTransportContext> = Symbol('playerTransport')
