import { AppError } from './errors'

const ALLOWED_AUDIO_TYPES = new Set(['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/x-m4a'])
const configuredMax = Number(process.env.MAX_AUDIO_DURATION_SECONDS)
export const MAX_AUDIO_DURATION_SECONDS = Number.isFinite(configuredMax) && configuredMax >= 5 && configuredMax <= 120 ? configuredMax : 60

type DurationReader = (buffer: Buffer, mimeType: string) => Promise<number | undefined>
const readDuration: DurationReader = async (buffer, mimeType) => {
    const { parseBuffer } = await import('music-metadata')
    const metadata = await parseBuffer(buffer, { mimeType, size: buffer.length })
    return metadata.format.duration
}

export async function validateAudioUpload(buffer: Buffer, contentType: string | undefined, durationReader: DurationReader = readDuration) {
    const mimeType = (contentType ?? '').split(';', 1)[0].trim().toLowerCase()
    if (!ALLOWED_AUDIO_TYPES.has(mimeType)) throw new AppError('Unsupported audio format', 415)
    let duration: number | undefined
    try { duration = await durationReader(buffer, mimeType) } catch { throw new AppError('The audio recording could not be read', 400) }
    if (!Number.isFinite(duration) || !duration || duration <= 0) throw new AppError('The audio duration could not be verified', 400)
    if (duration > MAX_AUDIO_DURATION_SECONDS + 0.5) throw new AppError(`Audio recordings are limited to ${MAX_AUDIO_DURATION_SECONDS} seconds`, 413)
    return { mimeType, duration }
}
