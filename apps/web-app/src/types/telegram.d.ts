// Telegram WebApp types
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        ready(): void
        expand(): void
        close(): void
        MainButton: {
          setText(text: string): void
          show(): void
          hide(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        BackButton: {
          show(): void
          hide(): void
          onClick(callback: () => void): void
          offClick(callback: () => void): void
        }
        initData: string
        initDataUnsafe: {
          user?: {
            id: number
            first_name: string
            last_name?: string
            username?: string
            photo_url?: string
            language_code?: string
          }
          auth_date?: number
          hash?: string
          query_id?: string
        }
        themeParams: {
          bg_color?: string
          text_color?: string
          hint_color?: string
          link_color?: string
          button_color?: string
          button_text_color?: string
        }
      }
    }
  }
}

export {}
