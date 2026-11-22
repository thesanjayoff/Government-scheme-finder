/**
 * Only links on these domains (or subdomains of them) are shown as official
 * application links without a warning. Everything else gets flagged.
 * This list is maintained by hand -- add a domain only after confirming it
 * is an official government portal.
 */
export const OFFICIAL_DOMAIN_ALLOW_LIST = [
  // Central government
  'gov.in',
  'nic.in',
  'india.gov.in',
  'myscheme.gov.in',
  'digilocker.gov.in',
  'umang.gov.in',
  'mygov.in',
  'pmkisan.gov.in',
  'pmjay.gov.in',
  'nsap.nic.in',
  'scholarships.gov.in',
  'dget.gov.in',
  'ncs.gov.in',
  'eshram.gov.in',
  'epfindia.gov.in',
  'uidai.gov.in',
  'csc.gov.in',
  'depwd.gov.in',
  'ncw.gov.in',
  'pib.gov.in',
  'mkisan.gov.in',
  'icar.org.in',
  'scholarships.gov.in',
  'nsap.nic.in',
  'pmaymis.gov.in',
  'pmayg.nic.in',
  'pmfby.gov.in',
  'jansuraksha.gov.in',
  'mudra.org.in',
  'kcc.gov.in',
  'aicte-india.org',
  'dsel.education.gov.in',
  'education.gov.in',
  'tntribalwelfare.tn.gov.in',
  // Tamil Nadu state government
  'tn.gov.in',
  'tnega.org',
  'tahsil.tn.gov.in',
  'tnsocialwelfare.tn.gov.in',
  'cms.tn.gov.in',
  'tnvelaivaaippu.gov.in',
  'tamilnaduhandloom.gov.in',
  'adidravidarwelfare.tn.gov.in',
  'bcmbcmw.tn.gov.in',
  'tahdco.com',
  'tnsdc.tn.gov.in',
  'aavin.tn.gov.in',
  'tnagrisnet.tn.gov.in',
  'tnfisheries.tn.gov.in',
] as const

export function extractDomain(url: string): string | null {
  try {
    const { hostname } = new URL(url)
    return hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return null
  }
}

/** True if the domain is the allow-listed domain itself or a subdomain of it. */
export function isOfficialDomain(url: string): boolean {
  const domain = extractDomain(url)
  if (!domain) return false
  return OFFICIAL_DOMAIN_ALLOW_LIST.some(
    (allowed) => domain === allowed || domain.endsWith(`.${allowed}`),
  )
}
