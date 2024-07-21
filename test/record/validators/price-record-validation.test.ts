import { IRecord, RecordClassEnum } from "../../../src"
import { PriceRecordValidator } from "../../../src/validators/records/price-validator"

describe('PriceRecordValidator', () => {
  let validator: PriceRecordValidator

  beforeEach(() => {
    validator = new PriceRecordValidator()
  })

  describe('validate', () => {
    const validPrices = [
      '0',
      '1',
      '999999999',
      '1000000000',
      '500000000.50',
    ]

    const invalidPrices = [
      '',
      'not a price',
      '-1',
      '1000000001',
      'Infinity',
      'NaN',
    ]

    test.each(validPrices)('should pass for valid price: %s', (price) => {
      const record: IRecord = { class: RecordClassEnum.Price, data: price }
      expect(validator.validate(record, { raiseError: false })).toBe(true)
      expect(validator.hasErrors()).toBe(false)
    })

    test.each(invalidPrices)('should fail for invalid price: %s', (price) => {
      const record: IRecord = { class: RecordClassEnum.Price, data: price }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.hasErrors()).toBe(true)
    })

    test('should add correct error for NaN', () => {
      const record: IRecord = { class: RecordClassEnum.Price, data: 'not a price' }
      validator.validate(record, { raiseError: false })
      expect(validator.getErrors()).toContain('Invalid price format')
    })

    test('should add correct error for price too low', () => {
      const record: IRecord = { class: RecordClassEnum.Price, data: '-1' }
      validator.validate(record, { raiseError: false })
      expect(validator.getErrors()).toContain('Price is too low')
    })

    test('should add correct error for price too high', () => {
      const record: IRecord = { class: RecordClassEnum.Price, data: '1000000001' }
      validator.validate(record, { raiseError: false })
      expect(validator.getErrors()).toContain('Price is too high')
    })
  })

  describe('error handling', () => {
    test('should throw error when raiseError is true', () => {
      const record: IRecord = { class: RecordClassEnum.Price, data: 'invalid-price' }
      expect(() => validator.validate(record, { raiseError: true })).toThrow('Invalid price format')
    })

    test('should not throw error when raiseError is false', () => {
      const record: IRecord = { class: RecordClassEnum.Price, data: 'invalid-price' }
      expect(() => validator.validate(record, { raiseError: false })).not.toThrow()
    })
  })

  describe('normalize', () => {
    const normalizationCases = [
      { input: '  123.45  ', expected: '123.45' },
      { input: '1000.00', expected: '1000' },
      { input: '0001', expected: '1' },
      { input: '1e3', expected: '1000' },
    ]

    test.each(normalizationCases)('should normalize "$input" to "$expected"', ({ input, expected }) => {
      const record: IRecord = { class: RecordClassEnum.Price, data: input }
      const normalizedRecord = validator.normalize(record)
      expect(normalizedRecord.data).toBe(expected)
    })
  })

  describe('rules', () => {
    test('should have correct min and max price rules', () => {
      expect(validator.rules).toEqual({
        minPrice: 0,
        maxPrice: 1_000_000_000
      })
    })
  })
})
