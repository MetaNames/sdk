import { toUnicode } from 'tr46'
import { IValidatorInterface, IValidatorOptions } from '../interface'

export interface INormalizeOptions extends IValidatorOptions {
  removeTLD?: boolean
}


export default class DomainValidator implements IValidatorInterface<string> {
  errors: string[] = []

  get rules() {
    return {
      minLength: 1,
      maxLength: 32
    }
  }

  validate(name: string, options: IValidatorOptions = { raiseError: true }): boolean {
    this.errors = []

    if (!name) this.errors.push('Domain name is required')
    if (typeof name !== 'string') this.errors.push('Domain name is required')
    if (name.length < this.rules.minLength) this.errors.push('Domain name is too short')
    if (name.length > this.rules.maxLength) this.errors.push('Domain name is too long')
    if (this.normalize(name, { removeTLD: false }) === '') this.errors.push('Domain name contains invalid characters')

    if (options.raiseError && this.errors.length > 0) throw new Error(this.errors.join(', '))

    return this.errors.length === 0
  }

  normalize(name: string, { removeTLD }: INormalizeOptions = { removeTLD: true }): string {
    // Remove .meta if it's there as it's redundant
    if (removeTLD && name.endsWith('.meta')) name = name.slice(0, -5)

    const reversed = name.split('.').reverse().join('.')
    // For some reason the toUnicode returns an object instead of a string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { domain, error } = toUnicode(reversed, { useSTD3ASCIIRules: true }) as any

    return error ? '' : domain
  }
}
