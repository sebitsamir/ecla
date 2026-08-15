export type CosmeticId = 'gold' | 'coral' | 'aurora' | 'moon' | 'violet'

export type GlowPalette = { core: string; mid: string; deep: string; halo: string }

export const COSMETICS: Record<CosmeticId, {
    id: CosmeticId
    name: string
    desc: string
    unlockText: string | null
    colors: GlowPalette
}> = {
    gold: {
        id: 'gold', name: 'Classic Gold', desc: 'Where every light begins.', unlockText: null,
        colors: { core: '#FFF6CF', mid: '#FFD876', deep: '#F09D2E', halo: '#FFC857' },
    },
    coral: {
        id: 'coral', name: 'Ember Coral', desc: 'A warm, steady flame.', unlockText: 'Reach a 3-day streak',
        colors: { core: '#FFE3DC', mid: '#FF9A7A', deep: '#F2542D', halo: '#FF6B5E' },
    },
    aurora: {
        id: 'aurora', name: 'Aurora Green', desc: 'The color of growing things.', unlockText: 'Master 5 concepts',
        colors: { core: '#EFFFF4', mid: '#7ED99A', deep: '#2FA36B', halo: '#7ED99A' },
    },
    moon: {
        id: 'moon', name: 'Moonlight Blue', desc: 'Cool light for night paths.', unlockText: 'Complete 10 lessons',
        colors: { core: '#E8F1FF', mid: '#8FB8FF', deep: '#4A7BD9', halo: '#7FA6FF' },
    },
    violet: {
        id: 'violet', name: 'Violet Dream', desc: 'For the truly consistent.', unlockText: 'Reach Radiant glow tier',
        colors: { core: '#F3EBFF', mid: '#B98CF0', deep: '#7C4FD9', halo: '#B98CF0' },
    },
}

export const DEFAULT_GLOW = COSMETICS.gold.colors