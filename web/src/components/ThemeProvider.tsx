'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'ecla-theme'

function isTheme(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(preference: ThemePreference) {
  const resolved = preference === 'system' ? systemTheme() : preference
  document.documentElement.dataset.theme = resolved
  document.documentElement.dataset.themePreference = preference
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f7f2e8' : '#08111a')
  return resolved
}

type ThemeContextValue = {
  preference: ThemePreference
  resolvedTheme: ResolvedTheme
  setPreference: (theme: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('dark')

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    const initial = isTheme(stored) ? stored : 'system'
    setPreferenceState(initial)
    setResolvedTheme(applyTheme(initial))
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: light)')
    const sync = () => {
      if (preference === 'system') setResolvedTheme(applyTheme('system'))
    }
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [preference])

  const setPreference = useCallback((theme: ThemePreference) => {
    window.localStorage.setItem(STORAGE_KEY, theme)
    setPreferenceState(theme)
    setResolvedTheme(applyTheme(theme))
  }, [])

  const value = useMemo(() => ({ preference, resolvedTheme, setPreference }), [preference, resolvedTheme, setPreference])
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}

