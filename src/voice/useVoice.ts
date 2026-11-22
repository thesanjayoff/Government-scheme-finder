import { useCallback, useRef, useState } from 'react'
import { getVoiceProvider } from './index'
import { useI18n } from '../i18n'

export function useVoice() {
  const { locale } = useI18n()
  const provider = useRef(getVoiceProvider())
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback(
    async (text: string) => {
      setIsSpeaking(true)
      try {
        await provider.current.speak(text, locale)
      } finally {
        setIsSpeaking(false)
      }
    },
    [locale],
  )

  const listen = useCallback(async (): Promise<string | null> => {
    setIsListening(true)
    try {
      return await provider.current.listen(locale)
    } catch {
      return null
    } finally {
      setIsListening(false)
    }
  }, [locale])

  const stop = useCallback(() => {
    provider.current.stopSpeaking()
    provider.current.stopListening()
    setIsListening(false)
    setIsSpeaking(false)
  }, [])

  return {
    speak,
    listen,
    stop,
    isListening,
    isSpeaking,
    isSupported: provider.current.isSupported(),
    sendsAudioOffDevice: provider.current.sendsAudioOffDevice,
    providerLabel: provider.current.label,
  }
}
