/** Node-compatible scheme loader for scripts (import.meta.glob only works under Vite). */
import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Scheme } from '../../src/types/scheme'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMES_DIR = join(__dirname, '..', '..', 'src', 'data', 'schemes')

export function loadAllSchemesFromDisk(): Scheme[] {
  const files = readdirSync(SCHEMES_DIR).filter((f) => f.endsWith('.json'))
  return files.map((f) => JSON.parse(readFileSync(join(SCHEMES_DIR, f), 'utf-8')) as Scheme)
}
