'use client'

import { authFetch } from '@/lib/apiClient'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { COSMETICS, CosmeticId, DEFAULT_GLOW, GlowPalette } from '@/lib/cosmetics'


/* Returns the equipped glow palette so every screen's firefly wears the user's choice */
export function useEquippedGlow(): GlowPalette {
    const { getToken } = useAuth()
    const [glow, setGlow] = useState<GlowPalette>(DEFAULT_GLOW)

    useEffect(() => {
        let cancelled = false
        async function load() {
            try {
                const res = await authFetch(`/api/v1/user/cosmetics`, getToken, {
                })
                if (!res.ok) return
                const data = await res.json()
                if (!cancelled && data.equippedCosmetic && COSMETICS[data.equippedCosmetic as CosmeticId]) {
                    setGlow(COSMETICS[data.equippedCosmetic as CosmeticId].colors)
                }
            } catch { /* keep default gold */ }
        }
        load()
        return () => { cancelled = true }
    }, [getToken])

    return glow
}