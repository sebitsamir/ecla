export type SceneMood = 'cafe' | 'street' | 'classroom' | 'service' | 'home'

export function sceneMood(setting: string): SceneMood {
    const value = setting.toLowerCase()
    if (/café|cafe|restaurant|market|shop|kiosk/.test(value)) return 'cafe'
    if (/street|station|bus|door|neighborhood|outside/.test(value)) return 'street'
    if (/class|school|library|museum/.test(value)) return 'classroom'
    if (/office|clinic|hotel|reception|work/.test(value)) return 'service'
    return 'home'
}

export function speakerIdentity(speaker?: string | null) {
    const name = speaker?.trim() || 'Your conversation partner'
    const initial = [...name][0]?.toLocaleUpperCase() ?? 'E'
    return { name, initial, id: name.toLocaleLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/[^a-z0-9]+/g, '-') }
}
