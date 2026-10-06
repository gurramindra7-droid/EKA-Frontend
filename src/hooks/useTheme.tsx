import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  mode: ThemeMode
  toggle: () => void
  setMode: (mode: ThemeMode) => void
}

const STORAGE_KEY = 'eka.theme.mode'

const ThemeContext = createContext<ThemeState | null>(null)

function readInitialMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage unavailable */
  }
  // Respect OS preference on first visit.
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/**
 * Theme mode state for EKA. Persists to localStorage; falls back to the
 * OS preference on first visit. Purely monochrome in both modes.
 */
export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readInitialMode)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      /* storage unavailable */
    }
    document.documentElement.dataset.theme = mode
  }, [mode])

  const toggle = useCallback(() => setModeState((m) => (m === 'light' ? 'dark' : 'light')), [])
  const setMode = useCallback((m: ThemeMode) => setModeState(m), [])
  const value = useMemo(() => ({ mode, toggle, setMode }), [mode, toggle, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeMode(): ThemeState {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useThemeMode must be used within <ThemeModeProvider>')
  return ctx
}
