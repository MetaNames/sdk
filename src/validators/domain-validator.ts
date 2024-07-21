import { toUnicode } from 'tr46'
import { IValidatorInterface, IValidatorOptions } from '../interface'
import { BaseValidator } from './base-validator'

export interface INormalizeOptions extends IValidatorOptions {
  removeTLD?: boolean
  reverse?: boolean
}


export class DomainValidator extends BaseValidator implements IValidatorInterface<string> {
  tld: string[]

  constructor(tld: string | string[]) {
    super()
    this.tld = Array.isArray(tld) ? tld : [tld]
  }

  get rules() {
    return {
      minLength: 1,
      maxLength: 32
    }
  }

  validate(name: string, options: IValidatorOptions = { raiseError: true }): boolean {
    this.clearErrors()

    if (!name) this.addError('Domain name is required')
    if (typeof name !== 'string') this.addError('Domain name is required')
    if (name.length < this.rules.minLength) this.addError('Domain name is too short')
    if (name.length > this.rules.maxLength) this.addError('Domain name is too long')

    const normalized = this.normalize(name, { removeTLD: true })
    if (normalized === '.' ||
      name.includes('..') ||
      this.normalize(name, { removeTLD: false }) === '') this.addError('Domain name contains invalid characters')

    if (options.raiseError) this.raiseErrors()

    return !this.hasErrors()
  }

  normalize(name: string, options: INormalizeOptions = {}): string {
    const { removeTLD, reverse } = { removeTLD: true, ...options }

    if (removeTLD) name = this.removeTld(name)
    if (reverse) name = name.split('.').reverse().join('.')
    if (name.includes('..')) name = name.replace(/\.\./g, '.')

    // For some reason the toUnicode returns an object instead of a string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { domain, error } = toUnicode(name, { useSTD3ASCIIRules: true }) as any

    return error ? '' : domain
  }

  private removeTld(name: string): string {
    let normalizedName = name

    this.tld.forEach(tld => {
      if (name.endsWith(`.${tld}`)) normalizedName = name.replace(`.${tld}`, '')
    })

    return normalizedName
  }
}
