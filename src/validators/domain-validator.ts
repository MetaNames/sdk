import { toUnicode } from 'tr46'
import { IValidatorInterface, IValidatorOptions } from '../interface'

export interface INormalizeOptions extends IValidatorOptions {
  removeTLD?: boolean
  reverse?: boolean
}


export class DomainValidator implements IValidatorInterface<string> {
  errors: string[] = []
  tld: string

  constructor(tld: string) {
    this.tld = tld
  }

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

    const normalized = this.normalize(name, { removeTLD: true })
    if (normalized === '.' ||
      name.includes('..') ||
      this.normalize(name, { removeTLD: false }) === '') this.errors.push('Domain name contains invalid characters')

    if (options.raiseError && this.errors.length > 0) throw new Error(this.errors.join(', '))

    return this.errors.length === 0
  }

  normalize(name: string, options: INormalizeOptions = {}): string {
    const { removeTLD, reverse } = { removeTLD: true, ...options }

    if (removeTLD && name.endsWith(`.${this.tld}`)) name = name.replace(`.${this.tld}`, '')
    if (reverse) name = name.split('.').reverse().join('.')
    if (name.includes('..')) name = name.replace(/\.\./g, '.')

    // For some reason the toUnicode returns an object instead of a string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { domain, error } = toUnicode(name, { useSTD3ASCIIRules: true }) as any

    return error ? '' : domain
  }
}
