// Base URL for the backend API.
// In production (including Supabase-hosted backend), set VITE_API_URL to the full API origin.
// In local development, fall back to the local server on port 4000.
const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:4000'

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
