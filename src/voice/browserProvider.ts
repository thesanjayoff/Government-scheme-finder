import type { VoiceProvider } from './types'

const LANG_TAGS: Record<'ta' | 'en', string> = { ta: 'ta-IN', en: 'en-IN' }

type SpeechRecognitionLike = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | undefined {
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

/**
 * Uses the browser's built-in Web Speech API.
 * speechSynthesis (text-to-speech) runs fully on-device.
 * SpeechRecognition (speech-to-text) is provided by the browser vendor and,
 * on most browsers (e.g. Chrome), sends audio to the vendor's cloud service
 * to transcribe -- this is disclosed to the user before first use.
 */
export function createBrowserVoiceProvider(): VoiceProvider {
  let currentRecognition: SpeechRecognitionLike | null = null

  return {
    id: 'browser',
    label: 'Browser built-in voice (on-device speech + browser speech recognition)',
    sendsAudioOffDevice: true, // conservative default: most browsers' STT is cloud-backed

    isSupported() {
      return typeof window !== 'undefined' && ('speechSynthesis' in window || getSpeechRecognitionCtor() !== undefined)
    },

    speak(text, lang) {
      return new Promise((resolve) => {
        if (!('speechSynthesis' in window)) {
          resolve()
          return
        }
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = LANG_TAGS[lang]
        utterance.onend = () => resolve()
        utterance.onerror = () => resolve()
        window.speechSynthesis.speak(utterance)
      })
    },

    stopSpeaking() {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    },

    listen(lang) {
      return new Promise((resolve, reject) => {
        const Ctor = getSpeechRecognitionCtor()
        if (!Ctor) {
          reject(new Error('Speech recognition is not supported in this browser.'))
          return
        }
        const recognition = new Ctor()
        currentRecognition = recognition
        recognition.lang = LANG_TAGS[lang]
        recognition.interimResults = false
        recognition.maxAlternatives = 1
        recognition.continuous = false

        recognition.onresult = (event) => {
          const transcript = event.results[0]?.[0]?.transcript ?? ''
          resolve(transcript)
        }
        recognition.onerror = (event) => {
          reject(new Error(`Speech recognition error: ${event.error}`))
        }
        recognition.onend = () => {
          currentRecognition = null
        }
        recognition.start()
      })
    },

    stopListening() {
      currentRecognition?.stop()
      currentRecognition = null
    },
  }
}
