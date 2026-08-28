import { DISALLOWED_RANGES, LEADING_MARK_RANGES, MAPPING_EXCEPTIONS } from './table'

/**
 * A minimal UTS-46 `toUnicode` with `useSTD3ASCIIRules` enabled.
 *
 * The reference implementation (tr46) ships an explicit mapping target for
 * every code point, which costs ~225 KB. Almost all of those targets are
 * reproducible from NFKC plus context-free case folding, both of which the
 * runtime already provides, so this module derives the common case natively and
 * consults a generated table only for what cannot be derived: the set of
 * disallowed code points, and 526 mapping exceptions.
 *
 * The generated table and this implementation are verified against tr46 over
 * every assigned code point and a large multi-label corpus; see
 * test/domain/idna.test.ts.
 */

type Ranges = Array<[number, number]>

let disallowedRanges: Ranges | undefined
let leadingMarkRanges: Ranges | undefined
let mappingExceptions: Map<number, string> | undefined

function decodeRanges(encoded: string): Ranges {
  const parsed: Ranges = []
  let cursor = 0

  for (const entry of encoded.split(',')) {
    const plus = entry.indexOf('+')
    const start = cursor + parseInt(entry.slice(0, plus), 36)
    const end = start + parseInt(entry.slice(plus + 1), 36)
    parsed.push([start, end])
    cursor = end
  }

  return parsed
}

function inRanges(cp: number, table: Ranges): boolean {
  let low = 0
  let high = table.length - 1

  while (low <= high) {
    const mid = (low + high) >> 1
    const range = table[mid]
    if (!range) break
    if (cp < range[0]) high = mid - 1
    else if (cp > range[1]) low = mid + 1
    else return true
  }

  return false
}

function exceptions(): Map<number, string> {
  if (mappingExceptions) return mappingExceptions

  mappingExceptions = new Map(MAPPING_EXCEPTIONS.map(([cp, to]) => [cp, to]))
  return mappingExceptions
}

function isDisallowed(cp: number): boolean {
  disallowedRanges ??= decodeRanges(DISALLOWED_RANGES)
  return inRanges(cp, disallowedRanges)
}

/** UTS-46 permits combining marks inside a label but not at its start. */
function isLeadingMark(cp: number): boolean {
  leadingMarkRanges ??= decodeRanges(LEADING_MARK_RANGES)
  return inRanges(cp, leadingMarkRanges)
}

/**
 * Case folding applied one code point at a time. `String#toLowerCase` on a
 * whole string applies Greek final-sigma context ('ΣΣ' becomes 'σς'), which
 * UTS-46 does not do -- it maps Σ to σ unconditionally.
 */
function caseFold(value: string): string {
  let out = ''
  for (const ch of value) out += ch.toLowerCase()
  return out
}

/** RFC 3492 punycode decoding, for `xn--` prefixed labels. */
const BASE = 36
const T_MIN = 1
const T_MAX = 26
const SKEW = 38
const DAMP = 700
const INITIAL_BIAS = 72
const INITIAL_N = 128

function adaptBias(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / DAMP) : delta >> 1
  d += Math.floor(d / numPoints)

  let k = 0
  while (d > ((BASE - T_MIN) * T_MAX) >> 1) {
    d = Math.floor(d / (BASE - T_MIN))
    k += BASE
  }

  return k + Math.floor(((BASE - T_MIN + 1) * d) / (d + SKEW))
}

function digitValue(codePoint: number): number {
  if (codePoint >= 0x30 && codePoint <= 0x39) return codePoint - 0x30 + 26
  if (codePoint >= 0x41 && codePoint <= 0x5a) return codePoint - 0x41
  if (codePoint >= 0x61 && codePoint <= 0x7a) return codePoint - 0x61
  return BASE
}

function punycodeDecode(input: string): string | null {
  const output: number[] = []
  const delimiter = input.lastIndexOf('-')

  let start = 0
  if (delimiter > 0) {
    for (let i = 0; i < delimiter; i++) {
      const cp = input.charCodeAt(i)
      if (cp > 0x7f) return null
      output.push(cp)
    }
    start = delimiter + 1
  }

  let n = INITIAL_N
  let bias = INITIAL_BIAS
  let i = 0

  for (let index = start; index < input.length;) {
    const oldi = i
    let w = 1

    for (let k = BASE; ; k += BASE) {
      if (index >= input.length) return null
      const digit = digitValue(input.charCodeAt(index++))
      if (digit >= BASE) return null
      if (digit > Math.floor((0x7fffffff - i) / w)) return null

      i += digit * w
      const t = k <= bias ? T_MIN : k >= bias + T_MAX ? T_MAX : k - bias
      if (digit < t) break
      if (w > Math.floor(0x7fffffff / (BASE - t))) return null
      w *= BASE - t
    }

    const outLength = output.length + 1
    bias = adaptBias(i - oldi, outLength, oldi === 0)

    if (Math.floor(i / outLength) > 0x7fffffff - n) return null
    n += Math.floor(i / outLength)
    i %= outLength

    if (n < 0 || n > 0x10ffff || (n >= 0xd800 && n <= 0xdfff)) return null
    output.splice(i++, 0, n)
  }

  return String.fromCodePoint(...output)
}

function mapLabel(label: string): string | null {
  const exceptionMap = exceptions()
  let mapped = ''

  for (const ch of label) {
    const cp = ch.codePointAt(0)
    if (cp === undefined) return null
    if (isDisallowed(cp)) return null

    const exception = exceptionMap.get(cp)
    mapped += exception !== undefined ? exception : caseFold(ch.normalize('NFKC'))
  }

  const composed = mapped.normalize('NFC')

  // The leading-mark rule applies to the *mapped* label, not the input. Code
  // points that UTS-46 ignores (variation selectors, soft hyphen) map to the
  // empty string, so a mark that followed one becomes label-leading only after
  // mapping.
  const leading = composed.codePointAt(0)
  if (leading !== undefined && isLeadingMark(leading)) return null

  return composed
}

export interface ToUnicodeResult {
  domain: string
  error: boolean
}

/**
 * Mirrors `tr46.toUnicode(name, { useSTD3ASCIIRules: true })` for the inputs
 * this SDK accepts: on success returns the mapped Unicode domain, otherwise
 * flags an error. Labels are processed independently, matching UTS-46.
 */
export function toUnicode(name: string): ToUnicodeResult {
  // UTS-46 treats the ideographic, fullwidth and halfwidth stops as label
  // separators and folds them to U+002E *before* splitting. Splitting on ASCII
  // '.' alone would leave them inside a label, so a following combining mark
  // would never be checked as the start of the next label.
  const labels = name.replace(/[。．｡]/g, '.').split('.')
  const output: string[] = []

  for (const label of labels) {
    let current = label

    if (/^xn--/i.test(current)) {
      const decoded = punycodeDecode(current.slice(4))
      if (decoded === null) return { domain: '', error: true }
      current = decoded
    }

    const mapped = mapLabel(current)
    if (mapped === null) return { domain: '', error: true }

    output.push(mapped)
  }

  return { domain: output.join('.'), error: false }
}
