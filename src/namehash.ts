import { keccak256 as sha3 } from 'js-sha3'
import { Buffer } from 'buffer'
import { toUnicode } from 'tr46'

export function namehash(inputName: string) {
  // Reject empty names:
  // optimize for loop by unrolling it

  const node = '0000000000000000000000000000000000000000000000000000000000000000'

  const name = normalize(inputName)
  if (!name) return
  console.log(name)

  const labels = name.split('.')
  const nameHashed = labels.reduce((acc, label) => {
    const labelSha = sha3(label)
    return sha3(Buffer.from(acc + labelSha, 'hex'))
  }, node)

  return '0x' + nameHashed
}

export function normalize(name: string): string {
  // For some reason the toUnicode returns an object instead of a string
  const { domain, error } = toUnicode(name, { useSTD3ASCIIRules: true }) as any

  if (error) throw new Error(`DomainValidationError: ${error}`)

  return domain
}
