import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'

const root = path.resolve(import.meta.dirname, '..')

function sourceFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const target = path.join(directory, entry.name)
        if (entry.isDirectory()) return sourceFiles(target)
        return /\.(css|ts|tsx)$/.test(entry.name) ? [target] : []
    })
}

test('brand source uses flat Nocturne Amber treatments', () => {
    const source = sourceFiles(path.join(root, 'src')).map(file => readFileSync(file, 'utf8')).join('\n')
    assert.doesNotMatch(source, /gradient/i)
    assert.doesNotMatch(source, /#(?:FF7A3D|FFC857|09090A|F4F0E8)/i)
    assert.match(source, /#e6a23c/i)
    assert.match(source, /#08111a/i)
})

test('Instrument Serif remains normal-weight and functional UI uses Geist', () => {
    const source = sourceFiles(path.join(root, 'src')).map(file => readFileSync(file, 'utf8')).join('\n')
    const classValues = [...source.matchAll(/className=(?:\{)?[\x22\x27\x60]([^\x22\x27\x60]+)[\x22\x27\x60]/g)].map(match => match[1])
    assert.equal(classValues.filter(value => value.includes('font-display') && /font-(?:bold|semibold|extrabold|black)/.test(value)).length, 0)
    const layout = readFileSync(path.join(root, 'src/app/layout.tsx'), 'utf8')
    assert.match(layout, /Instrument_Serif/)
    assert.match(layout, /Geist/)
    assert.match(layout, /--font-ecla-display/)
    assert.match(layout, /--font-ecla-body/)
})

test('custom ECLA identity assets replace the legacy mascot and missing favicon', () => {
    const brand = readFileSync(path.join(root, 'src/components/BrandLogo.tsx'), 'utf8')
    assert.match(brand, /ecla-lockup-dark\.png/)
    assert.match(brand, /ecla-lockup-light\.png/)
    assert.match(brand, /ecla-mark-dark\.png/)
    assert.doesNotMatch(brand, /Moon|radialGradient|linearGradient/)
    for (const name of ['ecla-lockup-dark.png', 'ecla-lockup-light.png', 'ecla-mark-dark.png', 'ecla-mark-light.png', 'ecla-app-icon.png']) {
        const file = path.join(root, 'public/brand', name)
        assert.equal(existsSync(file), true)
        assert.ok(statSync(file).size > 1_000)
    }
    const manifest = readFileSync(path.join(root, 'public/manifest.webmanifest'), 'utf8')
    assert.match(manifest, /\/brand\/ecla-app-icon\.png/)
    assert.doesNotMatch(manifest, /favicon\.svg/)
})
