import { describe, it, expect } from 'vitest'
import { checkTextForScams } from '../scamCheck'

describe('checkTextForScams', () => {
  it('flags an official-looking gov.in link as official', () => {
    const result = checkTextForScams('Apply at https://pmkisan.gov.in/apply now')
    expect(result.isOfficial).toBe(true)
  })

  it('flags a non-official domain as not official', () => {
    const result = checkTextForScams('Apply at https://pm-kisan-free-money.com/apply')
    expect(result.isOfficial).toBe(false)
  })

  it('detects an asks-fee pattern', () => {
    const result = checkTextForScams('Pay a registration fee of Rs 500 to receive your benefit')
    expect(result.matchedPatterns.some((p) => p.id === 'asks-fee')).toBe(true)
  })

  it('detects an OTP request pattern', () => {
    const result = checkTextForScams('Share your OTP to confirm the transfer')
    expect(result.matchedPatterns.some((p) => p.id === 'asks-otp')).toBe(true)
  })

  it('returns no url info when there is no link in the text', () => {
    const result = checkTextForScams('Just a plain message with no link')
    expect(result.extractedUrl).toBeNull()
    expect(result.isOfficial).toBeNull()
  })
})
