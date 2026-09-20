import assert from 'node:assert/strict'
import test from 'node:test'
import { BENCHMARK_PACKAGES, benchmarkVersion, validateBenchmarkPackages } from '../src/curriculum/benchmarks'

test('three benchmark packages contain complete practice, transfer, branching and retention contracts', () => {
    assert.deepEqual(validateBenchmarkPackages(), { passed:true, errors:[] })
    assert.deepEqual(BENCHMARK_PACKAGES.map(item=>item.competencyCode), ['PA1.SOC.GRT.01','PA1.NED.FOD.01','PA1.GAT.INT.01'])
    assert.ok(BENCHMARK_PACKAGES.every(item=>benchmarkVersion(item).length===64))
})
