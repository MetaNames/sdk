import { toUnicode } from 'tr46'
import { IValidatorInterface } from '../interface'

export default class DomainValidator implements IValidatorInterface<string> {
  validate(name: string): boolean {
    if (!name) throw new Error('Domain name is required')
    if (typeof name !== 'string') throw new Error('Domain name is required')
    if (name.length > 32) throw new Error('Domain name is too long')

    return true
  }

  normalize(name: string): string {
    // Remove .meta if it's there as it's redundant
    if (name.endsWith('.meta')) name = name.slice(0, -5)

    const reversed = name.split('.').reverse().join('.')
    // For some reason the toUnicode returns an object instead of a string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { domain, error } = toUnicode(reversed, { useSTD3ASCIIRules: true }) as any

    if (error) throw new Error('Domain contains non valid characters')

    return domain
  }
}
