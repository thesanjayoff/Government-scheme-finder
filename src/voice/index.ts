import type { VoiceProvider } from './types'
import { createBrowserVoiceProvider } from './browserProvider'
import { createRemoteProviderStub } from './remoteProviderStub'

export type { VoiceProvider } from './types'

const browserProvider = createBrowserVoiceProvider()

const PROVIDERS: Record<string, VoiceProvider> = {
  browser: browserProvider,
  bhashini: createRemoteProviderStub('bhashini', 'Bhashini'),
  sarvam: createRemoteProviderStub('sarvam', 'Sarvam AI'),
}

const configuredId = (import.meta.env.VITE_VOICE_PROVIDER as string | undefined) ?? 'browser'

/** The active voice provider: the configured one if it's actually usable, otherwise the on-device browser fallback. */
export function getVoiceProvider(): VoiceProvider {
  const configured = PROVIDERS[configuredId]
  if (configured && configured.isSupported()) return configured
  return browserProvider
}
