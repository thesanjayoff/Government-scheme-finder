/** Thin, failure-safe localStorage wrapper. Every read/write is local-only -- nothing here ever touches the network. */
export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable (private browsing) -- fail silently, in-memory state still works.
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export function clearAllAppStorage(prefix: string): void {
  try {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith(prefix))
    keys.forEach((k) => localStorage.removeItem(k))
  } catch {
    // ignore
  }
}
