import { isOfficialDomain, extractDomain } from '../data/domainAllowList'

export interface ScamPattern {
  id: string
  pattern: RegExp
  label: { ta: string; en: string }
}

// Deliberately simple, explainable keyword/pattern checks -- not an AI judgement call.
export const SCAM_PATTERNS: ScamPattern[] = [
  {
    id: 'asks-fee',
    pattern: /(processing fee|registration fee|pay.{0,15}(rs|₹|rupees)|சேர்க்கை கட்டணம்|செயலாக்க கட்டணம்|பணம் அனுப்ப)/i,
    label: { ta: 'கட்டணம் கேட்கிறது', en: 'Asks you to pay a fee' },
  },
  {
    id: 'asks-otp',
    pattern: /(otp|one.?time.?password|ஓடிபி)/i,
    label: { ta: 'OTP கேட்கிறது', en: 'Asks for an OTP' },
  },
  {
    id: 'guarantee',
    pattern: /(guarantee(d)?|100% approv|உத்தரவாதம்|கண்டிப்பாக கிடைக்கும்)/i,
    label: { ta: 'உத்தரவாதம் அளிக்கிறது', en: 'Promises a guaranteed outcome' },
  },
  {
    id: 'urgency',
    pattern: /(act now|urgent|expires today|last chance|இன்றே|உடனடி)/i,
    label: { ta: 'அவசரப்படுத்துகிறது', en: 'Creates false urgency' },
  },
  {
    id: 'lottery',
    pattern: /(lottery|prize|winner|lucky draw|பரிசு|லாட்டரி)/i,
    label: { ta: 'பரிசு/லாட்டரி கூறுகிறது', en: 'Mentions a lottery or prize' },
  },
  {
    id: 'bank-pin',
    pattern: /(pin number|cvv|upi pin|bank password|வங்கி கடவுச்சொல்)/i,
    label: { ta: 'வங்கி PIN/கடவுச்சொல் கேட்கிறது', en: 'Asks for a bank PIN/password' },
  },
]

export interface ScamCheckResult {
  extractedUrl: string | null
  domain: string | null
  isOfficial: boolean | null
  matchedPatterns: ScamPattern[]
}

const URL_REGEX = /(https?:\/\/[^\s]+|www\.[^\s]+)/i

export function checkTextForScams(input: string): ScamCheckResult {
  const urlMatch = input.match(URL_REGEX)
  const extractedUrl = urlMatch ? urlMatch[0] : null
  const normalizedUrl = extractedUrl && !extractedUrl.startsWith('http') ? `https://${extractedUrl}` : extractedUrl
  const domain = normalizedUrl ? extractDomain(normalizedUrl) : null
  const isOfficial = normalizedUrl ? isOfficialDomain(normalizedUrl) : null
  const matchedPatterns = SCAM_PATTERNS.filter((p) => p.pattern.test(input))
  return { extractedUrl: normalizedUrl, domain, isOfficial, matchedPatterns }
}
