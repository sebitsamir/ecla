'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { COSMETICS, CosmeticId, DEFAULT_GLOW, GlowPalette } from '@/lib/cosmetics'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

/* Returns the equipped glow palette so every screen's firefly wears the user's choice */
export function useEquippedGlow(): GlowPalette {
    const { getToken } = useAuth()
    const [glow, setGlow] = useState<GlowPalette>(DEFAULT_GLOW)

    useEffect(() => {
        let cancelled = false
        async function load() {
            try {
                const token = await getToken()
                const res = await fetch(`${API_URL}/api/v1/user/cosmetics`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (!res.ok) return
                const data = await res.json()
                if (!cancelled && data.equippedCosmetic && COSMETICS[data.equippedCosmetic as CosmeticId]) {
                    setGlow(COSMETICS[data.equippedCosmetic as CosmeticId].colors)
                }
            } catch (e) { /* keep default gold */ }
        }
        load()
        return () => { cancelled = true }
    }, [getToken])

    return glow
}