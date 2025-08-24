/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_I18N_DEFAULT: string
  readonly VITE_AI_MODE: string
  readonly VITE_ENABLE_PWA: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
