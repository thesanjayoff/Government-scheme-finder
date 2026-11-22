#!/usr/bin/env node
/**
 * Minimal browser smoke test: starts no server itself (run `npm run dev`
 * separately, or point BASE_URL at a `vite preview` build) and drives the
 * app with Playwright, failing if anything throws in the console or a key
 * screen fails to render. This is a smoke test, not a full e2e suite --
 * see README "Evaluation" for what full UI testing with real users found.
 *
 * Usage: npm run dev   (in one terminal)
 *        node e2e/smoke.mjs   (in another)
 */
import { chromium } from 'playwright'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5173'
const errors = []

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text())
})
page.on('pageerror', (err) => errors.push('pageerror: ' + err.message))

async function check(label, fn) {
  try {
    await fn()
    console.log(`ok - ${label}`)
  } catch (e) {
    console.error(`FAIL - ${label}: ${e.message}`)
    process.exitCode = 1
  }
}

await check('home page loads with Tamil title', async () => {
  await page.goto(BASE_URL, { waitUntil: 'networkidle' })
  const title = await page.title()
  if (!title.includes('Thagaval Thunai')) throw new Error(`unexpected title: ${title}`)
})

await check('question flow starts and shows a question', async () => {
  await page
    .getByRole('link', { name: /தொடங்கு|Start/i })
    .first()
    .click()
  await page.waitForURL('**/question')
  const h2 = await page.textContent('h2')
  if (!h2) throw new Error('no question heading found')
})

await check('results page renders scheme cards', async () => {
  await page.getByRole('button', { name: /முடிவுகளைக்|results/i }).click()
  await page.waitForURL('**/results')
  await page.waitForTimeout(300)
  const body = await page.textContent('body')
  if (!body?.includes('DRAFT') && !body) throw new Error('results page body empty')
})

await check('scam checker flags a non-official domain', async () => {
  await page.goto(`${BASE_URL}/#/scam-check`, { waitUntil: 'networkidle' })
  await page.getByRole('textbox').fill('Pay a fee at http://totally-fake-scheme.win and share your OTP')
  await page.getByRole('button', { name: /சரிபார்|Check/i }).click()
  await page.waitForTimeout(200)
  const body = await page.textContent('body')
  if (!body?.toLowerCase().includes('totally-fake-scheme.win')) throw new Error('domain not echoed back')
})

await check('privacy page has a delete-everything control', async () => {
  await page.goto(`${BASE_URL}/#/privacy`, { waitUntil: 'networkidle' })
  const body = await page.textContent('body')
  if (!body) throw new Error('privacy page empty')
})

if (errors.length) {
  console.error(`FAIL - ${errors.length} console error(s):`)
  errors.forEach((e) => console.error('  ' + e))
  process.exitCode = 1
} else {
  console.log('ok - no console errors across the whole run')
}

await browser.close()
process.exit(process.exitCode ?? 0)
