import DomainValidator from '../../src/validators/domain-validator'

test('validation of proper domain name', () => {
    const name = 'name.meta'
    const validator = new DomainValidator()
    expect(validator.validate(name)).toBe(true)
})

test('validation of a too long domain name fails', () => {
    const name = 'a'.repeat(33)
    const validator = new DomainValidator()
    expect(() => { validator.validate(name) }).toThrow('Domain name is too long')
})

test('validation of an domain name with emoji', () => {
    const name = '🌎.meta'
    const validator = new DomainValidator()
    expect(validator.validate(name)).toBe(true)
})

test('validation of an domain name with non valid chars', () => {
    const name = 'not_valid'
    const validator = new DomainValidator()
    expect(() => { validator.validate(name) }).toThrow('Domain name contains invalid characters')
})

test('validation without raiseError option populates errors array', () => {
    const name = 'not_valid'.repeat(10)
    const validator = new DomainValidator()
    validator.validate(name, { raiseError: false })
    expect(validator.errors.length).toBe(2)
    expect(validator.errors).toContain('Domain name is too long')
    expect(validator.errors).toContain('Domain name contains invalid characters')
})

test('normalization of proper domain name', () => {
    const name = 'name.meta'
    const validator = new DomainValidator()
    expect(validator.normalize(name)).toBe('name')
})

test('normalization of proper subdomain name', () => {
    const name = 'the.name.meta'
    const validator = new DomainValidator()
    expect(validator.normalize(name)).toBe('name.the')
})

test('normalization of an domain name with emoji', () => {
    const name = '🌎.meta'
    const validator = new DomainValidator()
    expect(validator.normalize(name)).toBe('🌎')
})

test('normalization of an domain name with non valid chars', () => {
    const name = 'not_valid'
    const validator = new DomainValidator()
    expect(validator.normalize(name)).toBe('')
})
