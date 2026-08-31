'use client'

import { useCallback, useSyncExternalStore } from 'react'

const EVENT = 'ecla:preference-updated'
const subscribe = (notify: () => void) => {
    window.addEventListener('storage', notify)
    window.addEventListener(EVENT, notify)
    return () => {
        window.removeEventListener('storage', notify)
        window.removeEventListener(EVENT, notify)
    }
}

/** Hydration-safe preferences; unavailable storage falls back without crashing. */
export function useStoredPreference(key: string, fallback: string) {
    const read = useCallback(() => {
        try { return localStorage.getItem(key) ?? fallback } catch { return fallback }
    }, [key, fallback])
    const value = useSyncExternalStore(subscribe, read, () => fallback)
    const write = useCallback((next: string) => {
        try { localStorage.setItem(key, next) } catch { return }
        window.dispatchEvent(new Event(EVENT))
    }, [key])
    return [value, write] as const
}
