const int = (value: string | undefined, fallback: number) => { const parsed = Number(value); return Number.isInteger(parsed) && parsed >= 1000 && parsed <= 120000 ? parsed : fallback }
export const AI_TIMEOUT_MS = int(process.env.AI_TIMEOUT_MS, 20_000)
export const TRANSCRIPTION_TIMEOUT_MS = int(process.env.TRANSCRIPTION_TIMEOUT_MS, 30_000)
export const providerOptions = (timeoutMs = AI_TIMEOUT_MS) => ({ signal: AbortSignal.timeout(timeoutMs) })
