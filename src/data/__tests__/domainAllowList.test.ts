import { describe, it, expect } from 'vitest'
import { isOfficialDomain } from '../domainAllowList'

describe('isOfficialDomain', () => {
  it('accepts an exact allow-listed domain', () => {
    expect(isOfficialDomain('https://pmkisan.gov.in/apply')).toBe(true)
  })

  it('accepts a subdomain of an allow-listed domain', () => {
    expect(isOfficialDomain('https://cra.tn.gov.in/eleg_schemes.php')).toBe(true)
  })

  it('rejects a look-alike domain', () => {
    expect(isOfficialDomain('https://pmkisan-gov.in.scam.example.com')).toBe(false)
  })

  it('rejects a non-government domain', () => {
    expect(isOfficialDomain('https://randomblog.com/pmkisan')).toBe(false)
  })

  it('returns false for an invalid URL', () => {
    expect(isOfficialDomain('not a url')).toBe(false)
  })
})
