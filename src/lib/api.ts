// Base URL for the backend API.
// In production, configure `VITE_API_URL` to point at your deployed backend
// (for example, your Supabase container URL that exposes this Node server).
// If it's not set, we fall back to the current origin (useful when the
// frontend and backend are served from the same domain) or a localhost dev URL.
// Default to the current origin so Vite dev proxy (`/api` -> 5000) can forward
// cookies on the same host/port. Override with VITE_API_URL for production.
const DEFAULT_API_URL =
  typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'

// Use a typed-safe access to Vite env vars without assuming ImportMeta typings
const viteEnv = ((import.meta as any).env || {}) as { VITE_API_URL?: string }

const BASE_URL = viteEnv.VITE_API_URL || DEFAULT_API_URL

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    credentials: 'include',
  })
  if (!res.ok) {
    let message = 'Request failed'
    try {
      const data = await res.json()
      message = data.error || message
    } catch {}
    throw new Error(message)
  }
  return res.json()
}
