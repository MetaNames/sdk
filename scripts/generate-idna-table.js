#!/usr/bin/env node
/**
 * Regenerates src/validators/idna/table.ts from tr46.
 *
 * The full UTS-46 mapping table is ~225 KB because it stores an explicit
 * mapping target for every code point. Most of those targets are exactly what
 * you get from NFKC + context-free case folding, which every JS runtime already
 * implements natively. So instead of shipping the table we ship only what
 * cannot be derived:
 *
 *   - `DISALLOWED`: run-length encoded ranges of code points UTS-46 rejects
 *     under useSTD3ASCIIRules. This is the bulk of what the native operations
 *     get wrong -- they happily pass through control characters, unassigned
 *     code points and symbols that IDNA forbids.
 *   - `EXCEPTIONS`: the handful of code points whose UTS-46 mapping differs
 *     from NFKC + case folding.
 *
 * Run with tr46 installed:  node scripts/generate-idna-table.js
 */
const fs = require('fs')
const path = require('path')
const { toUnicode } = require('tr46')

function caseFold(s) {
  // Per code point, so JS's contextual final-sigma rule (which UTS-46 does not
  // apply) never triggers: 'ΣΣ'.toLowerCase() is 'σς', but UTS-46 wants 'σσ'.
  let out = ''
  for (const ch of s) out += ch.toLowerCase()
  return out
}

function derive(cp) {
  const mapped = caseFold(String.fromCodePoint(cp).normalize('NFKC')).normalize('NFC')
  for (const ch of mapped) {
    const c = ch.codePointAt(0)
    if (c < 128 && !/[a-z0-9-]/.test(ch)) return null
  }
  return mapped
}

const run = s => {
  const r = toUnicode(s, { useSTD3ASCIIRules: true })
  return r.error ? null : r.domain
}

// Code-point status must be probed *in context*, not standalone. UTS-46 also
// enforces a label-level rule -- "a label must not begin with a combining
// mark" -- so testing a bare combining mark reports an error that belongs to
// the label, not to the code point. Deriving from standalone probes therefore
// wrongly marks every combining mark disallowed and rejects names like "Á".
//
// '0' is used as the neutral padding because no precomposed character exists
// for digit-plus-mark, so NFC cannot merge the padding with the probe.
const PAD = '0'

const disallowed = []
const leadingMarks = []
const exceptions = []

for (let cp = 0; cp <= 0x10ffff; cp++) {
  if (cp >= 0xd800 && cp <= 0xdfff) continue // lone surrogates
  const ch = String.fromCodePoint(cp)

  const inContext = run(PAD + ch + PAD)
  if (inContext === null) {
    disallowed.push(cp)
    continue
  }

  // Allowed in context but rejected at the start of a label => combining mark.
  if (run(ch + PAD) === null) leadingMarks.push(cp)

  const expected = inContext.slice(PAD.length, inContext.length - PAD.length)
  if (expected !== derive(cp)) exceptions.push([cp, expected])
}

// Run-length encode a sorted code point set as [start, end] pairs.
function toRanges (points) {
  const ranges = []
  let start = null
  let prev = null
  for (const cp of points) {
    if (start === null) { start = cp; prev = cp } else if (cp === prev + 1) { prev = cp } else { ranges.push([start, prev]); start = cp; prev = cp }
  }
  if (start !== null) ranges.push([start, prev])
  return ranges
}

// Delta-encode range starts and lengths in base 36 to keep the emitted source
// compact; decoding happens once at module load.
function encode (ranges) {
  const parts = []
  let cursor = 0
  for (const [s, e] of ranges) {
    parts.push((s - cursor).toString(36) + '+' + (e - s).toString(36))
    cursor = e
  }
  return parts.join(',')
}

const ranges = toRanges(disallowed)
const markRanges = toRanges(leadingMarks)
const encodedRanges = encode(ranges)
const encodedMarks = encode(markRanges)

const banner = `// GENERATED FILE -- do not edit by hand.
// Regenerate with: node scripts/generate-idna-table.js
//
// Derived from tr46 (UTS-46, useSTD3ASCIIRules). See the generator for why only
// the disallowed ranges and mapping exceptions are stored rather than the full
// ~225 KB mapping table.
`

const out = `${banner}
/** Run-length encoded ranges of code points UTS-46 disallows. */
export const DISALLOWED_RANGES = '${encodedRanges}'

/**
 * Run-length encoded ranges of combining marks. UTS-46 allows these inside a
 * label but rejects any label that begins with one.
 */
export const LEADING_MARK_RANGES = '${encodedMarks}'

/** Code points whose UTS-46 mapping differs from NFKC + case folding. */
export const MAPPING_EXCEPTIONS: ReadonlyArray<readonly [number, string]> = ${JSON.stringify(exceptions)}
`

const target = path.join(__dirname, '..', 'src', 'validators', 'idna', 'table.ts')
fs.mkdirSync(path.dirname(target), { recursive: true })
fs.writeFileSync(target, out)

console.log(`disallowed code points : ${disallowed.length}`)
console.log(`disallowed ranges      : ${ranges.length}`)
console.log(`leading-mark ranges    : ${markRanges.length}`)
console.log(`mapping exceptions     : ${exceptions.length}`)
console.log(`emitted                : ${target} (${out.length} bytes)`)
