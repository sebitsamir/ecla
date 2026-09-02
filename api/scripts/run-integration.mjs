import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const target = new URL(process.env.TEST_DATABASE_URL ?? 'postgresql://invalid/invalid')
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '55439' || target.pathname !== '/ecla_phase1_test') throw new Error('Set TEST_DATABASE_URL to localhost:55439/ecla_phase1_test only')
const cli = fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url))
const child = spawn(process.execPath, [cli, '--test', '--test-concurrency=1', 'integration/*.test.ts'], { stdio: 'inherit', env: { ...process.env, DATABASE_URL: target.toString(), NODE_ENV: 'test' } })
child.once('exit', code => process.exit(code ?? 1))
