import DomainValidator from '../../src/validators/domain'

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
    expect(() => { validator.normalize(name) }).toThrow('Domain contains non valid characters')
})
