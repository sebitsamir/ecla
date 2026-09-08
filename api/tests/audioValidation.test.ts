import assert from 'node:assert/strict'
import test from 'node:test'
import { validateAudioUpload } from '../src/lib/audioValidation'

test('audio validation rejects disguised and overlong uploads', async () => {
    await assert.rejects(validateAudioUpload(Buffer.from('not audio'), 'application/octet-stream', async () => 1), /Unsupported audio format/)
    await assert.rejects(validateAudioUpload(Buffer.from('audio'), 'audio/webm;codecs=opus', async () => 61), /limited to 60 seconds/)
})

test('audio validation accepts a verified bounded recording', async () => {
    const result = await validateAudioUpload(Buffer.from('audio'), 'audio/ogg', async (_buffer, mime) => {
        assert.equal(mime, 'audio/ogg')
        return 12.5
    })
    assert.equal(result.duration, 12.5)
})

test('production metadata reader measures an actual WAV container', async () => {
    const sampleRate = 8000
    const pcmBytes = sampleRate * 2
    const wav = Buffer.alloc(44 + pcmBytes)
    wav.write('RIFF', 0); wav.writeUInt32LE(36 + pcmBytes, 4); wav.write('WAVE', 8)
    wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22)
    wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34)
    wav.write('data', 36); wav.writeUInt32LE(pcmBytes, 40)
    const result = await validateAudioUpload(wav, 'audio/wav')
    assert.equal(result.duration, 1)
})
