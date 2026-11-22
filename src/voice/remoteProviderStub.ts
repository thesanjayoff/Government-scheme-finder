import type { VoiceProvider } from './types'

/**
 * Stub adapter for a production speech provider (Bhashini or Sarvam AI).
 * Both require registering for API credentials and agreeing to their
 * production terms -- this repo ships the adapter shape but no live
 * integration, since no credentials are available in this environment.
 *
 * To wire up a real provider: implement speak()/listen() against that
 * provider's REST API, reading the API key from an environment variable
 * (VITE_BHASHINI_API_KEY / VITE_SARVAM_API_KEY), and flip
 * `sendsAudioOffDevice` to match that provider's actual behaviour.
 */
export function createRemoteProviderStub(id: 'bhashini' | 'sarvam', label: string): VoiceProvider {
  const notConfigured = () =>
    Promise.reject(
      new Error(
        `${label} is not configured in this build (no API key set). Falling back to the on-device/browser voice provider.`,
      ),
    )

  return {
    id,
    label: `${label} (not configured -- falls back to browser voice)`,
    sendsAudioOffDevice: true,
    isSupported: () => false,
    speak: () => notConfigured(),
    stopSpeaking: () => {},
    listen: () => notConfigured(),
    stopListening: () => {},
  }
}
