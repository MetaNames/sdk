import { DomainValidator } from '../../src/validators'
import { config } from '../helpers'

const validator = new DomainValidator(config.contract.tld)

test('validation of proper domain name', () => {
    const name = 'name.mpc'
    expect(validator.validate(name)).toBe(true)
})

test('validation of a too long domain name fails', () => {
    const name = 'a'.repeat(33)
    expect(() => { validator.validate(name) }).toThrow('Domain name is too long')
})

test('validation of an domain name with emoji', () => {
    const name = '🌎.mpc'
    expect(validator.validate(name)).toBe(true)
})

test('validation of an domain name with non valid chars', () => {
    const name = 'not_valid'
    expect(() => { validator.validate(name) }).toThrow('Domain name contains invalid characters')
    const name2 = 'not..valid'
    expect(() => { validator.validate(name2) }).toThrow('Domain name contains invalid characters')
    const name3 = '.'
    expect(() => { validator.validate(name3) }).toThrow('Domain name contains invalid characters')
    const name4 = '..'
    expect(() => { validator.validate(name4) }).toThrow('Domain name contains invalid characters')
})

test('validation without raiseError option populates errors array', () => {
    const name = 'not_valid'.repeat(10)
    validator.validate(name, { raiseError: false })
    expect(validator.getErrors().length).toBe(2)
    expect(validator.getErrors()).toContain('Domain name is too long')
    expect(validator.getErrors()).toContain('Domain name contains invalid characters')
})

test('normalization of proper domain name', () => {
    const name = 'name.mpc'
    expect(validator.normalize(name)).toBe('name')
})

test('normalization of proper domain name uppercase', () => {
    const name = 'NaME.mpc'
    expect(validator.normalize(name)).toBe('name')
})

test('normalization of proper subdomain name', () => {
    const name = 'the.name.mpc'
    expect(validator.normalize(name)).toBe('the.name')
})

test('normalization with reverse option', () => {
    const name = 'the.name.mpc'
    expect(validator.normalize(name, { reverse: true })).toBe('name.the')
})

test('normalization of an domain name with emoji', () => {
    const name = '🌎.mpc'
    expect(validator.normalize(name)).toBe('🌎')
})

test('normalization of an domain name with non valid chars', () => {
    const name = 'not_valid'
    expect(validator.normalize(name)).toBe('')
})
