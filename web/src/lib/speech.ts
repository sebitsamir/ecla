// Browser TTS utilities — single source of truth for speech across the app

let voicesCache: SpeechSynthesisVoice[] = []
let speechEndedAt = 0

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const load = () => { voicesCache = window.speechSynthesis.getVoices() }
    load()
    window.speechSynthesis.addEventListener?.('voiceschanged', load)
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
    const prefix = lang.split('-')[0].toLowerCase()
    const norm = (l: string) => l.toLowerCase().replace('_', '-')
    return (
        voicesCache.find(v => norm(v.lang).startsWith(prefix) && /google|microsoft|natural|enhanced/i.test(v.name)) ||
        voicesCache.find(v => norm(v.lang).startsWith(prefix)) ||
        null
    )
}

// True while any utterance is audible right now
export function isSpeechActive(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking
}

// True once the room has had time to settle after Ecla stopped talking
export function speechCooldownDone(ms = 600): boolean {
    return Date.now() - speechEndedAt > ms
}

export function cancelSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
    }
}

export function speak(text: string, lang = 'es-ES', opts?: { onStart?: () => void; onEnd?: () => void }) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) {
        opts?.onEnd?.()
        return
    }

    const clean = text
        .replace(/[¿?¡*_#`>|]/g, '')
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
        .replace(/\s+/g, ' ')
        .trim()
    if (!clean) { opts?.onEnd?.(); return }

    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(clean)
    u.lang = lang
    const voice = pickVoice(lang)
    if (voice) u.voice = voice
    u.rate = 1

    let finished = false
    const finish = () => {
        if (finished) return
        finished = true
        clearTimeout(watchdog)
        speechEndedAt = Date.now()
        opts?.onEnd?.()
    }

    const estMs = Math.min(20000, clean.split(/\s+/).length * 700 + 2000)
    const watchdog = setTimeout(finish, estMs)

    u.onstart = () => opts?.onStart?.()
    u.onend = finish
    u.onerror = finish
    window.speechSynthesis.speak(u)
}

export function extractSpanish(text: string): string {
    const segments = text.match(/[^.!?¿¡\n]+[.!?¿¡]*/g) || []
    const spanish = segments.filter(s =>
        /[¿¡áéíóúñüÁÉÍÓÚÑÜ]/.test(s) ||
        /\b(el|la|los|las|una?|del?|que|qué|cómo|estoy|estás|está|estamos|están|es|son|yo|tú|mi|mis|por|para|pero|muy|gracias|hola|buenos|buenas|día|mañana|sí)\b/i.test(s)
    )
    return spanish.map(s => s.trim()).join(' ')
}

export function speakSpanish(text: string, opts?: { onStart?: () => void; onEnd?: () => void }): boolean {
    const es = extractSpanish(text)
    if (es) { speak(es, 'es-ES', opts); return true }
    speak(text, 'en-US', opts)
    return true
}