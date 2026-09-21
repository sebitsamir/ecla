'use client'
import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if (!('serviceWorker' in navigator)) return

        if (process.env.NODE_ENV === 'production') {
            navigator.serviceWorker.register('/sw.js').catch(() => undefined)
            return
        }

        // A worker installed by a production preview can otherwise keep serving
        // cache-first assets while the local development server is running.
        navigator.serviceWorker.getRegistrations()
            .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
            .catch(() => undefined)

        if ('caches' in window) {
            caches.keys()
                .then(keys => Promise.all(keys.filter(key => key.startsWith('ecla-static-')).map(key => caches.delete(key))))
                .catch(() => undefined)
        }
    }, [])
    return null
}
