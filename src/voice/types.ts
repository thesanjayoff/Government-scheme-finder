export interface VoiceProvider {
  id: string
  /** Human-readable name shown in Settings so users know what's being used. */
  label: string
  /** Speaks text aloud. Resolves when speech finishes (or immediately if unsupported). */
  speak(text: string, lang: 'ta' | 'en'): Promise<void>
  /** Stops any speech in progress. */
  stopSpeaking(): void
  /** Listens for a single utterance and resolves with the recognized text. */
  listen(lang: 'ta' | 'en'): Promise<string>
  /** Cancels an in-progress listen() call. */
  stopListening(): void
  /** Whether listen()/speak() can actually work in this browser/environment. */
  isSupported(): boolean
  /**
   * Whether audio for this provider leaves the device (sent to a cloud speech
   * API) or is processed fully on-device. Shown in the privacy notice.
   */
  sendsAudioOffDevice: boolean
}
