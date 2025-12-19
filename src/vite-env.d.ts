/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_DEVQUEST_ENABLED?: string
  readonly VITE_OVERLAYS_ENABLED?: string
  readonly VITE_DEVCONSOLE_ENABLED?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

