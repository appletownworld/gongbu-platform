/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_COURSE_SERVICE_URL: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly MODE: string
  // добавьте другие переменные окружения здесь
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
