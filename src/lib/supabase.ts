import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tmp-placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'tmp-placeholder'

  try {
    return createBrowserClient(url, key)
  } catch (err) {
    console.warn('Supabase client initialization failed:', err)
    return null as any
  }
}
