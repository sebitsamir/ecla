// Browser TTS utilities — single source of truth for speech across the app

export function cancelSpeech() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
    }
}

export function speak(text: string, lang = 'es-ES', opts?: { onStart?: () => void; onEnd?: () => void }) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || !text.trim()) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.startsWith(lang.split('-')[0]))
    if (voice) u.voice = voice
    u.rate = 0.95
    u.onstart = () => opts?.onStart?.()
    u.onend = () => opts?.onEnd?.()
    u.onerror = () => opts?.onEnd?.()
    window.speechSynthesis.speak(u)
}

// Keep only the Spanish sentences of a mixed reply so playback sounds natural
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
    if (!es) return false
    speak(es, 'es-ES', opts)
    return true
}