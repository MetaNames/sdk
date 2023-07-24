import { toUnicode } from 'tr46'
import { IValidatorInterface } from '../interface'

export default class DomainValidator implements IValidatorInterface {
  validate(name: string): boolean {
    if (!name) throw new Error('Domain name is required')
    if (typeof name !== 'string') throw new Error('Domain name is required')
    if (name.length > 32) throw new Error('Domain name is too long')

    return true
  }

  normalize(name: string): string {
    // For some reason the toUnicode returns an object instead of a string
    const reversed = name.split('.').reverse().join('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { domain, error } = toUnicode(reversed, { useSTD3ASCIIRules: true }) as any

    if (error) throw new Error('Domain contains non valid characters')

    return domain
  }
}
