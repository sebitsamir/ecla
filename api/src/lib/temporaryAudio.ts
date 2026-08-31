import { createReadStream } from 'node:fs'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/** Each request owns a private directory; cleanup also runs on provider failure. */
export async function withTemporaryAudio<T>(
    bytes: Buffer,
    consume: (stream: ReturnType<typeof createReadStream>) => Promise<T>,
): Promise<T> {
    const directory = await mkdtemp(join(tmpdir(), 'ecla-voice-'))
    let stream: ReturnType<typeof createReadStream> | undefined
    try {
        const file = join(directory, 'recording.webm')
        await writeFile(file, bytes, { mode: 0o600 })
        stream = createReadStream(file)
        return await consume(stream)
    } finally {
        if (stream && !stream.closed) {
            await new Promise<void>(resolve => {
                stream!.once('close', resolve)
                stream!.destroy()
            })
        }
        await rm(directory, { recursive: true, force: true, maxRetries: 3 })
    }
}
