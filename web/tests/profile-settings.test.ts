import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')

test('profile settings use authenticated persistent account contracts', () => {
    const profile = readFileSync(path.join(root, 'src/app/profile/page.tsx'), 'utf8')
    assert.match(profile, /\/api\/v1\/users\/me\/preferences/)
    assert.match(profile, /\/api\/v1\/privacy\/export/)
    assert.match(profile, /DELETE MY LEARNING DATA/)
    assert.match(profile, /DELETE MY ACCOUNT/)
    assert.match(profile, /\/api\/v1\/privacy\/account/)
    assert.match(profile, /openUserProfile/)
})

test('appearance preference is applied before paint and follows system changes', () => {
    const layout = readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8')
    const provider = readFileSync(path.join(root, 'src/components/ThemeProvider.tsx'), 'utf8')
    const styles = readFileSync(path.join(root, 'src/app/globals.css'), 'utf8')
    assert.match(layout, /themeBootScript/)
    assert.match(provider, /localStorage\.setItem\(STORAGE_KEY/)
    assert.match(provider, /prefers-color-scheme: light/)
    assert.match(styles, /:root\[data-theme="light"\]/)
})
