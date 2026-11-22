import { useState } from 'react'
import { useI18n } from '../i18n'
import { useSession } from '../state/SessionProvider'
import { useVoice } from '../voice/useVoice'

export function PrivacyPage() {
  const { t, locale } = useI18n()
  const { deleteEverything } = useSession()
  const { sendsAudioOffDevice, providerLabel } = useVoice()
  const [confirming, setConfirming] = useState(false)

  const notice =
    locale === 'ta'
      ? {
          whatWeCollect: 'நீங்கள் தட்டச்சு செய்யும் அல்லது தேர்வு செய்யும் பதில்கள் (வயது, வருமானம், போன்றவை), குடும்ப புனைப்பெயர்கள், ஆவண சரிபார்ப்பு பட்டியல், கண்காணிப்பு குறிப்புகள்.',
          why: 'நீங்கள் தகுதி பெறக்கூடிய அரசு திட்டங்களை கணக்கிடுவதற்கு மட்டும். இந்த கணக்கீடு முழுவதும் உங்கள் சாதனத்திலேயே நடக்கிறது.',
          where: 'உங்கள் சாதனத்தின் local storage-இல் மட்டும் சேமிக்கப்படுகிறது. இது எந்த சர்வருக்கும் அனுப்பப்படுவதில்லை.',
          howToDelete: 'கீழே உள்ள "அனைத்தையும் நீக்கு" பொத்தானை அழுத்தி எந்த நேரத்திலும் நிரந்தரமாக நீக்கலாம்.',
          voice: 'குரல் உள்ளீடு பயன்படுத்தினால், அது உங்கள் உலாவியின் பேச்சு அங்கீகார சேவைக்கு அனுப்பப்படலாம் (கீழே பார்க்கவும்). பதிவுகள் சேமிக்கப்படுவதில்லை.',
          contact: 'கேள்விகள் இருந்தால், இந்த திட்டத்தை உருவாக்கியவர்களை தொடர்பு கொள்ளவும்.',
        }
      : {
          whatWeCollect: 'The answers you type or select (age, income, etc.), household nicknames, your document checklist, and tracker notes.',
          why: 'Only to work out which government schemes you may be eligible for. This calculation happens entirely on your device.',
          where: 'Stored only in this device\'s local storage. It is never sent to any server.',
          howToDelete: 'Use the "Delete everything" button below, at any time, to permanently erase it.',
          voice: 'If you use voice input, your speech may be sent to your browser\'s speech recognition service (see below). No recordings are stored by this app.',
          contact: 'If you have questions, please contact the people who built this tool.',
        }

  return (
    <div className="page">
      <h1>{t('privacy.title')}</h1>
      <section className="card">
        <h3>{locale === 'ta' ? 'என்ன சேகரிக்கிறோம்' : 'What we collect'}</h3>
        <p>{notice.whatWeCollect}</p>
        <h3>{locale === 'ta' ? 'ஏன்' : 'Why'}</h3>
        <p>{notice.why}</p>
        <h3>{locale === 'ta' ? 'எங்கே சேமிக்கப்படுகிறது' : 'Where it stays'}</h3>
        <p>{notice.where}</p>
        <h3>{locale === 'ta' ? 'நீக்குவது எப்படி' : 'How to delete it'}</h3>
        <p>{notice.howToDelete}</p>
        <h3>{locale === 'ta' ? 'குரல் செயலாக்கம்' : 'Voice processing'}</h3>
        <p>{notice.voice}</p>
        <p className="muted">
          {locale === 'ta' ? 'தற்போதைய வழங்குநர்' : 'Current provider'}: {providerLabel} --{' '}
          {sendsAudioOffDevice
            ? locale === 'ta'
              ? 'ஒலி சாதனத்திற்கு வெளியே அனுப்பப்படலாம்'
              : 'audio may leave this device'
            : locale === 'ta'
              ? 'ஒலி சாதனத்திலேயே செயலாக்கப்படுகிறது'
              : 'audio is processed on-device'}
        </p>
        <h3>{locale === 'ta' ? 'தொடர்பு' : 'Contact'}</h3>
        <p>{notice.contact}</p>
      </section>

      <section className="card">
        {!confirming ? (
          <button type="button" className="btn btn-secondary btn-block" onClick={() => setConfirming(true)}>
            {t('privacy.deleteAll')}
          </button>
        ) : (
          <div className="stack">
            <p>{t('privacy.deleteConfirm')}</p>
            <button
              type="button"
              className="btn btn-primary btn-block"
              onClick={() => {
                deleteEverything()
                setConfirming(false)
              }}
            >
              {t('common.confirm')}
            </button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => setConfirming(false)}>
              {t('common.cancel')}
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
