#!/usr/bin/env node
/**
 * Exhaustively checks src/validators/idna against tr46 over every code point
 * and a generated multi-label corpus. Kept out of the jest suite because the
 * full sweep takes minutes; run it after regenerating the table.
 *
 * tr46 is no longer a dependency, so install it just for the run:
 *
 *   yarn add --dev tr46 @types/tr46 && node scripts/verify-idna.js
 */
require('ts-node').register({ compilerOptions: { module: 'CommonJS', esModuleInterop: true, target: 'ES2022' } })
const { toUnicode: mine } = require('../src/validators/idna')
const { toUnicode: ref } = require('tr46')

const refRun = s => { const r = ref(s, { useSTD3ASCIIRules: true }); return r.error ? null : r.domain }
const myRun = s => { const r = mine(s); return r.error ? null : r.domain }

let tested = 0
let mismatches = 0
const samples = []

function check (s) {
  tested++
  const a = refRun(s)
  const b = myRun(s)
  if (a !== b) {
    mismatches++
    if (samples.length < 20) samples.push(`${JSON.stringify(s)} tr46=${JSON.stringify(a)} mine=${JSON.stringify(b)}`)
  }
}

console.log('sweeping every code point...')
for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue
  check(String.fromCodePoint(cp))
}
console.log(`  ${tested} single code points, ${mismatches} mismatches`)

console.log('sweeping multi-code-point labels...')
const before = tested
// Combining marks, Hangul jamo and compatibility forms are where per-code-point
// derivation is most likely to diverge from whole-string normalisation.
const interesting = [
  0x41, 0x61, 0x5a, 0x2d, 0x30, 0x300, 0x301, 0x308, 0x327, 0x1100, 0x1161, 0x11a8,
  0x212b, 0x1e9b, 0x3a3, 0x3c2, 0x3c3, 0xdf, 0x130, 0x131, 0xff21, 0xff41, 0x2260,
  0xfb00, 0xfb01, 0x24b6, 0x2460, 0x1f600, 0x1f1fa, 0x1f1f8, 0x5b57, 0x200d, 0x200c,
  0x2e, 0x5f, 0x20, 0x2013, 0x3002, 0xff0e, 0xff61
]
for (const a of interesting) {
  for (const b of interesting) {
    check(String.fromCodePoint(a) + String.fromCodePoint(b))
    for (const c of [0x61, 0x301, 0x2e, 0x1100]) {
      check(String.fromCodePoint(a) + String.fromCodePoint(b) + String.fromCodePoint(c))
    }
  }
}
console.log(`  ${tested - before} multi-code-point strings, ${mismatches} cumulative mismatches`)

console.log('checking real registry names and fixtures...')
const real = [
  'hölkj.mpc', 'hermès.mpc', 'nestlé.mpc', 'beyoncé.mpc', 'damgård.mpc', 'kénôse.mpc',
  'pokémon.mpc', '👨‍💻.mpc', '🐳🐳🐳.mpc', '💎💎💎.mpc', '💲💲💲.mpc', '💵💵💵.mpc',
  '🦄🦄🦄.mpc', 'виталик.mpc', 'ivanbjerredamgård.mpc', 'recently🔹registered.mpc',
  'аауцуауцауца.mpc', 'fatmamıçokseviyorumbenege.mpc',
  'name.mpc', 'NaME.mpc', 'the.name.mpc', '🌎.mpc', 'not_valid', 'not..valid', '.', '..',
  'xn--ls8h', 'xn--80ak6aa92e', 'xn--fiq228c', 'café', 'CAFÉ', 'münchen', 'MÜNCHEN'
]
real.forEach(check)

console.log('fuzzing random strings...')
const fuzzBefore = tested
// Mulberry32, seeded, so a failure is reproducible.
let seed = 0x9e3779b9
const rand = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
for (let i = 0; i < 2000000; i++) {
  const len = 1 + Math.floor(rand() * 8)
  let s = ''
  for (let j = 0; j < len; j++) {
    const roll = rand()
    let cp
    if (roll < 0.35) cp = interesting[Math.floor(rand() * interesting.length)]
    else if (roll < 0.6) cp = 0x20 + Math.floor(rand() * 0x60)
    else cp = Math.floor(rand() * 0x11000)
    if (cp >= 0xd800 && cp <= 0xdfff) cp = 0x61
    s += String.fromCodePoint(cp)
  }
  check(s)
}
console.log(`  ${tested - fuzzBefore} random strings, ${mismatches} cumulative mismatches`)

console.log(`\ntotal: ${tested} inputs, ${mismatches} mismatches`)
samples.forEach(s => console.log('  ' + s))
process.exit(mismatches === 0 ? 0 : 1)
