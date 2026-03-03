"use client"

import { createBrowserClient as createClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createClient> | null = null

export function createBrowserClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

  return supabaseInstance
}
