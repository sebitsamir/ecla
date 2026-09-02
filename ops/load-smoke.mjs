const origin = process.env.TARGET_ORIGIN
if (!origin || !/^https?:\/\//.test(origin)) throw new Error('Set TARGET_ORIGIN to the staging API origin')
const concurrency = Math.min(100, Math.max(1, Number(process.env.CONCURRENCY ?? 20)))
const requests = Math.min(5000, Math.max(concurrency, Number(process.env.REQUESTS ?? 200)))
const durations = []
let failures = 0
let cursor = 0
async function worker() {
  while (cursor < requests) {
    cursor += 1; const start = performance.now()
    try { const response = await fetch(`${origin}/api/v1/health/live`, { signal: AbortSignal.timeout(5000) }); if (!response.ok) failures += 1 } catch { failures += 1 }
    durations.push(performance.now() - start)
  }
}
await Promise.all(Array.from({ length: concurrency }, worker))
durations.sort((a,b) => a-b)
const p95 = durations[Math.floor(durations.length * .95)] ?? 0
console.log(JSON.stringify({ requests, concurrency, failures, p95Ms: Math.round(p95) }))
if (failures || p95 > Number(process.env.MAX_P95_MS ?? 1000)) process.exitCode = 1
