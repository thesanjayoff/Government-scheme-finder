# Thagaval Thunai (தகவல் துணை)

**"Thagaval Thunai"** means "information companion" in Tamil. It's an installable, offline-first PWA that helps a person — or a volunteer/e-Sevai operator helping them — find the government welfare schemes they're likely eligible for, in Tamil first and English second.

It is **information only**. It never decides eligibility, never applies on anyone's behalf, never collects money, and — critically — **all eligibility logic runs on the user's device**. The server (or static host) only ever serves static files; it never sees anyone's answers.

The product name lives in one place: `src/config/appConfig.ts` (`APP_CONFIG.appName` / `appNameTa`). Change it there to rebrand the whole app.

## Why this exists, and what it refuses to do

1. **Every scheme shown comes only from the curated database in `src/data/schemes/*.json`.** The eligibility engine (`src/engine/`) never invents a scheme, rule, amount, or deadline — it's a pure function over data files, with no network call in the runtime path.
2. **Every scheme carries sources, a `lastVerified` date, and a `reviewer` field.** Entries older than `APP_CONFIG.staleAfterDays` (default 180 days) show a visible staleness warning and rank lower.
3. **Results always say**: "likely eligible according to the published criteria; the department makes the final decision. Confirm at the official office or website." (shown on every results page, every scheme card).
4. **No Aadhaar/PAN/bank account numbers are ever asked for**, anywhere in the question registry (`src/data/questions.ts`). Sensitive questions (disability %, social category, religious minority status) are optional, explained, skippable, and deliberately asked *last* by the adaptive question selector.
5. **Only `officialLinks` on an allow-listed government domain** (`src/data/domainAllowList.ts`) are shown without a warning; anything else is flagged.
6. **Adults/guardians only** — there is no child mode; a guardian helping a minor is told to use the tool themselves.

## Tech stack

- **Vite + React 19 + TypeScript**, no server-side framework — the whole app is static output (`npm run build` → `dist/`), deployable to any static host (Vercel, Netlify, GitHub Pages, or just a folder on a phone's local web server).
- **`vite-plugin-pwa`** for the service worker, offline precaching, and the installable manifest.
- **`react-router-dom`** (`HashRouter`, so it works from a `file://`-like static deployment without server rewrite rules).
- **Zod**, used only at build/validate time (`scripts/validate-data.ts`), not shipped to the client bundle (keeps the runtime bundle small for low-end phones — see "Data pipeline" below).
- No UI component library, no CSS framework — hand-written CSS with large touch targets (48px minimum), visible focus rings, and both light/dark themes via CSS variables.
- No backend, no database, no analytics SDK, no ads, no payment code anywhere in this repo.

## Running it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build         # production build to dist/ (runs the data validator first)
npm run preview        # serve the production build locally
```

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm run validate-data` | Validates every scheme JSON file (schema, domain allow-list, missing-field references, contradictions, staleness) and prints a needs-review report |
| `npm run validate-data:links` | Same, plus an actual network reachability check of every link (not run in CI by default — explicit opt-in since it needs network) |
| `npm test` | Unit tests (Vitest) for the engine, validator, scam checker, ranking |
| `npm run eval` | The evaluation harness — see "Evaluation" below |
| `npm run test:e2e` | A Playwright smoke test against a running dev server (`npm run dev` in one terminal, `npm run test:e2e` in another) |

## Architecture

```
src/
  config/appConfig.ts      -- app name / tagline / locale config (single source of truth)
  types/                   -- Scheme, Criterion/Condition (rule language), Question types
  data/
    questions.ts            -- the fixed question registry (19 questions)
    schemes/*.json          -- the scheme database, one file per scheme
    schemeSchema.ts          -- zod schema scheme files must satisfy
    domainAllowList.ts      -- official-domain allow-list
    helpCentres.json         -- verified help-centre/helpline directory
    loadSchemes.ts           -- runtime loader (Vite import.meta.glob, no network)
  engine/
    ruleEvaluator.ts         -- pure, three-valued-logic (true/false/unknown) rule evaluator
    questionSelector.ts      -- adaptive "which question reduces uncertainty most" selector
    ranking.ts               -- result ranking (relevance, freshness, effort, "highest value first")
    scamCheck.ts              -- the link/message scam checker
  i18n/                     -- en.json / ta.json UI strings + the i18n React context
  voice/                    -- voice provider abstraction (browser Web Speech API + Bhashini/Sarvam adapter stubs)
  state/                    -- local-only session state (household, tracker, documents), localStorage-backed
  components/, pages/        -- the UI
scripts/
  validate-data.ts          -- the data pipeline / review-workflow validator
  eval/                     -- the evaluation harness (personas, independent oracle, runner)
  generate-icons.mjs        -- rasterizes the SVG app icon to PWA PNG sizes
e2e/smoke.mjs               -- Playwright smoke test
```

### The rule language (rules as data)

`src/types/rules.ts` defines a small, closed, JSON-serializable `Condition` AST (`eq`, `neq`, `gte`, `lte`, `gt`, `lt`, `between`, `in`, `notIn`, `includesAny`, `exists`, `and`, `or`, `not`). `src/engine/ruleEvaluator.ts` is the only place that interprets it — **there is no `eval`, no dynamic `Function()`, no code execution of any kind from a data file.** A scheme file can only ever express a declarative condition tree over the fixed question registry, so adding or editing scheme data can never introduce arbitrary behavior.

The evaluator uses **three-valued logic** (`true` / `false` / `unknown`) so an unanswered question never silently resolves to "false" — `and(false, unknown) = false`, `and(true, unknown) = unknown`, `or(true, unknown) = true`, `or(false, unknown) = unknown`, etc. (tested explicitly in `src/engine/__tests__/ruleEvaluator.test.ts`, including the boundary cases the spec called out: age exactly 60, income exactly at a ceiling).

**Outcome classification** (`eligible` / `almost-eligible` / `not-eligible` / `unknown`):
- Any matched **exclusion**, or any **hard-failed** criterion (false and not within its `nearMissMargin`) → `not-eligible`.
- All criteria resolved, nothing pending → `eligible`.
- Nothing has been confirmed at all yet (every criterion still unanswered) → `unknown`, even if the scheme only has 1–2 criteria — "almost" implies some positive signal already, not a blank slate.
- 1–2 criteria pending (a near-miss and/or an unanswered question), with at least one criterion already confirmed → `almost-eligible`.
- More than 2 pending → `unknown`.

### The adaptive question flow

`src/engine/questionSelector.ts` picks the next question by counting, across every scheme that isn't yet `not-eligible`, how many have an unresolved criterion referencing each candidate field — then prioritizes non-sensitive fields, and (since the v1 tuning pass, see "Evaluation") only lets a scheme's remaining fields influence the next pick once that scheme already has *more than half* its criteria confirmed. This keeps a scheme with zero signal from dragging in an extra, low-value question, which is what gets the flow down to the ~6–8 question target instead of working through every field every scheme might ever need.

## Data pipeline and review workflow

A scheme is a JSON file in `src/data/schemes/`, validated against `src/data/schemeSchema.ts`. **Status lifecycle:** `draft` → `needs-review` → `published`. **Only `status: "published"` schemes are shown to real end users** — this is enforced in `src/data/loadSchemes.ts`, independent of anything the UI does.

To add a scheme:
1. Research it from an official source (`.gov.in` / `.nic.in` / an allow-listed state domain). Write original Tamil and English summaries — never copy site text verbatim.
2. Write the JSON file, citing every fact's source URL, with `lastVerified` set to today and `reviewer` identifying who checked it.
3. Run `npm run validate-data` — it checks the schema, that `officialLinks` are on the domain allow-list, that every rule field exists in the question registry, for same-field contradictions in the top-level AND'd criteria, and flags stale/unpublished entries.
4. A human reviewer (a social worker, an e-Sevai operator, or anyone with subject-matter knowledge) checks it against the official source and flips `status` to `"published"` with their name in `reviewer`.
5. Periodically, re-run `npm run validate-data:links` (network required) to catch dead/moved official links, and re-check source pages for changes — bump `lastVerified` after each re-check.

**Current data honesty note:** every scheme currently in `src/data/schemes/` has `status: "needs-review"` — they were drafted from real, cited official and secondary sources during initial development, but **no human reviewer has signed off on them yet**, as this project's own principles require. Because of that:
- The **production build** (`npm run build` → `.env.production`, `VITE_SHOW_UNREVIEWED=false`) shows **zero schemes** until someone actually reviews and publishes them. This is intentional, not a bug.
- The **dev build** (`npm run dev` → `.env.development`, `VITE_SHOW_UNREVIEWED=true`) shows the needs-review drafts with a visible orange **"DRAFT"** badge on every card, so the app is usable to look at and test end-to-end before that review happens.

**31 schemes** are currently drafted (target in the brief was 40–60; this is a solid first batch, built by four parallel research passes covering education, farmers, women & family, seniors & widows, disability, workers & employment, health insurance, and housing — 18 central + 13 Tamil Nadu state schemes). The pipeline above is what the next batch (and ongoing maintenance) runs through.

## Eligibility engine evaluation (the main deliverable)

Run `npm run eval`. It does two things:

**1. Eligibility correctness**, against an *independent* oracle (`scripts/eval/oracle.ts`) — a hand-written restatement of each scheme's rule in plain boolean/number logic, deliberately **not** built by calling the engine's `Condition`/`evaluateScheme` machinery, so it can catch real implementation bugs (and it did — see below). Run across 66 synthetic personas (`scripts/eval/personas.ts`), including deliberate boundary cases (age exactly at a threshold, income exactly at a ceiling) × 31 schemes = **2,046 assertions**:

```
Accuracy: 100.0%
Precision (positive = eligible/almost-eligible): 100.0%
Recall: 100.0%
Near-miss accuracy: 100.0% (403/403)
Confusion: TP=492 FP=0 FN=0 TN=1554
```

This process *did* find and fix two real engine bugs during development, which is the point of having an independent check:
- The outcome classifier originally mixed up a near-miss-only case with a near-miss-plus-unknown case in a way that didn't match the "1-2 pending → almost-eligible" rule consistently (now covered by regression tests in `ruleEvaluator.test.ts`).
- The adaptive question selector would chase a sensitive field (disability %) too early because a short 2-criterion scheme could claim it was "touched" after matching just 1 of 2 criteria (now requires a strict majority — see tuning note below).

**2. Rule integrity**: `npm run validate-data` is the automated check that every scheme has sources, a verified date, valid schema, domain-safe links, and no field references a nonexistent question — it's part of `npm run build` (as a `prebuild` step) so a broken data file can't ship.

**3. Question efficiency**, over 8 "fully-answerable" personas (every field has a real value, unlike the sparse boundary-case personas above, so the stopping point reflects genuine convergence rather than "ran out of fields to ask"):

```
Average questions to reach stable results: 5.1
Maximum questions: 8
Share of personas whose top-5 results still changed in the last 3 questions: 88% (7/8)
```

The average/max land inside the spec's ~6–8 question target. The last number is an honest limitation: with 31 schemes of varied shapes, the top-5 ranked shortlist can still reorder in the final couple of questions for most personas, because overall flows are short (5 on average) so "the last 3 questions" is most of the flow. This is worth revisiting once there's a larger, more mature scheme set — a longer flow would make "did the last 3 questions matter" a more meaningful signal, and a "require 2 consecutive unchanged top-5 lists before stopping" rule would likely tighten it further.

### What this evaluation is **not**

- **Not the human-verified 200-profile test set the project brief calls for.** That requires an actual social worker or e-Sevai operator checking synthetic profiles against the law, which nothing automated can substitute for. The harness and personas are built so that work is a matter of *reviewing and extending* `scripts/eval/personas.ts` and getting a human to sign off on expected outcomes — not building new infrastructure.
- **Not a comparison against myScheme's live eligibility checker** — that needs live manual testing against their running portal, not something to automate from here.
- **Not usability testing with real Tamil speakers** (8+ people, some low-literacy, some elderly) — the UI was built to the brief's accessibility/simplicity constraints (large buttons, plain language, voice support) and smoke-tested end-to-end with Playwright + manual screenshot review (see `e2e/smoke.mjs`), but that's a proxy for, not a substitute for, real usability sessions.
- **Not a Tamil speech Word-Error-Rate measurement** — see "Voice" below for why.
- **Safety tests** (prompt-injection, "invent a scheme", non-official-link warnings): the non-official-link warning is unit-tested (`domainAllowList.test.ts`) and exercised in the e2e smoke test; there is currently no AI/LLM layer in the app at all (see "Conversational layer" below), so the prompt-injection-resistance requirement doesn't yet apply — it will when that layer is built.
- **Accessibility**: built to WCAG 2.2 AA practice (semantic headings, visible focus rings, `aria-pressed`/`aria-expanded`/`aria-live` where relevant, 48px touch targets, skip-to-content link, no color-only signaling — outcomes use both color and an icon/text badge) but **not run through an automated axe/Lighthouse audit or a screen reader** in this session — that's a concrete next step, not a claim of a passed audit.

## Privacy and security

- **Local-first.** `src/state/` keeps all answers, household members (by nickname only — no identity fields exist), the document checklist, and the application tracker in `localStorage`, read/written through `src/state/storage.ts`. Nothing is ever sent over the network by this app at runtime.
- **Privacy notice** (`/privacy`) in both languages, written toward the DPDP Act's eventual notice/consent obligations: what's collected, why, where it stays, and a one-tap **delete everything** that wipes every `tt.*` localStorage key.
- **Content Security Policy**: `script-src 'self'` (no inline scripts, no `unsafe-eval`), `object-src 'none'`, `frame-ancestors 'none'`, injected into the **production** build only (`vite.config.ts`, `injectCspPlugin`) — Vite's dev server needs an inline HMR preamble that a strict `script-src` would otherwise block.
- **No third-party trackers, no analytics SDK** anywhere in the dependency tree.
- **Official-domain allow-list** (`src/data/domainAllowList.ts`) gates which links are shown as trustworthy; the data validator enforces it for every `officialLinks` entry at build time.
- **Scam-link checker** (`/scam-check`) reuses the same domain allow-list plus a small, explainable set of regex patterns (asks for a fee, asks for an OTP, promises a guarantee, creates urgency, mentions a lottery, asks for a bank PIN) — unit-tested in `scamCheck.test.ts`.
- **Not yet done** (documented honestly rather than skipped silently): signed data releases / subresource integrity for a CDN deployment, automated dependency scanning in CI, and a scheduled "re-check official pages for changes" job — these are deployment/CI concerns outside what a single local build can set up without a hosting target and a CI provider actually chosen.

## Voice

- **Text-to-speech**: the browser's built-in `speechSynthesis` API, which runs fully on-device.
- **Speech-to-text**: the browser's built-in `SpeechRecognition` API. On most browsers (e.g. Chrome) this is vendor-cloud-backed, not on-device — the privacy page discloses this plainly and names the active provider.
- **Provider adapters** (`src/voice/`) are built for Bhashini and Sarvam AI (`VITE_VOICE_PROVIDER=bhashini|sarvam`), matching the brief's "provider adapters + offline fallback" shape, but **ship as stubs** (`remoteProviderStub.ts`) — both require registering for production API credentials, which this environment doesn't have. They fail over cleanly to the browser provider with a clear console message. Wiring a real key in is a matter of implementing `speak()`/`listen()` against that provider's REST API inside the stub file; no other code needs to change.
- Because there's no live Bhashini/Sarvam integration, there's no real Tamil-speech Word-Error-Rate to report yet — that evaluation needs a configured provider and real speaker recordings.

## Assisted mode

`/assisted` — large-text toggle (no accounts, no identities, nothing stored differently than solo mode), a one-tap **reset for next person** that wipes the whole session, and a printable session summary (`window.print()`) instead of a stored record, per the brief's "share with the person, don't store it" instruction.

## Household mode

`/household` — add members by nickname only; household-level questions (income, location, land, ration card, housing) are shared, person-level questions are asked per active member, switchable from the results page.

## Conversational layer

**Not built.** The brief marks this "optional," and it's the one place an LLM would touch user answers at all — building it safely (never deciding eligibility, never naming a scheme outside the database, resisting prompt injection from pasted text) deserves its own focused pass with a configured model provider, rather than being bolted on last. The architecture doesn't block it: `useEvaluations`/`evaluateScheme` already produce structured, citable output that a future conversational layer could explain in plain language without ever being the source of truth.

## Known limitations (full honesty pass)

- 31 of the target 40–60 schemes; none human-published yet (see "Data pipeline" above).
- A few scheme `sources` entries point at reputable secondary sources (news coverage, explainer sites) rather than only official domains — this is allowed for `sources` (which just has to be *a* citation) but never for `officialLinks` (which must be official-domain only, and is enforced by the validator). Several flagged in the validator's own needs-review report.
- No question field yet exists for "studied in a government/government-aided school" or "currently pregnant/recently gave birth" or "recent death of the household's primary breadwinner" — a few scheme criteria approximate these with the closest existing field (education level, age+gender, income/ration-card) and say so in the plain-language explanation text rather than invent a new field under time pressure. Adding those fields is a clean, additive change to `src/data/questions.ts`.
- Bundle size is ~155KB gzipped JS — reasonable, not yet aggressively optimized for the lowest-end devices (no route-level code splitting yet).
- No custom web font is bundled for Tamil; the app relies on the device's system Tamil font so it works fully offline without a large bundled font file. This was a deliberate choice, not an oversight, given the offline-first requirement.

## Build order followed

Scheme data format + validator → rule evaluator with tests → question flow + results page (Tamil/English) → first 17 verified-in-draft schemes → document checklists + official links with domain checks → privacy notice + local storage → next 14 schemes (parallel research passes) → near-miss + household mode → voice in/out → assisted mode → scam link checker → reminders/tracker (basic manual tracker shipped; push-notification reminders not yet wired to a service worker alarm) → evaluation harness.
