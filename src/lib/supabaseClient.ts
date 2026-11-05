import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Set them in .env (see .env.example).',
  )
}

/** `?demo` on the dev server shows sample data; it must never change the real database. */
const demo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo')

const demoSafeFetch: typeof fetch = (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return fetch(input, init)
  return Promise.resolve(
    new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }),
  )
}

export const supabase = createClient(url, anonKey, demo ? { global: { fetch: demoSafeFetch } } : undefined)
