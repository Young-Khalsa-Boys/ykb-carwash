import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    console.error('Supabase environment variables are missing!')
    return null as any
  }

  try {
    return createBrowserClient(url, key)
  } catch (err) {
    console.error('Supabase client initialization failed:', err)
    return null as any
  }
}
