import { kMaxLength } from "buffer"
import { IRecord, RecordClassEnum } from "../../../src"
import { MainRecordValidator } from "../../../src/validators/records/main-validator"

describe('MainRecordValidator', () => {
  let validator: MainRecordValidator

  beforeEach(() => {
    validator = new MainRecordValidator()
  })

  // Test Cases
  const testCases = [
    { input: '1', expectedValid: true },
    { input: '0', expectedValid: true },
    { input: '', expectedValid: false, expectedError: 'Value is required' },
    { input: 'true', expectedValid: false, expectedError: 'Must be "1" or "0"' },
    { input: 'false', expectedValid: false, expectedError: 'Must be "1" or "0"' },
    { input: '2', expectedValid: false, expectedError: 'Must be "1" or "0"' },
    { input: 'hello', expectedValid: false, expectedError: 'Must be "1" or "0"' },
    { input: ' 1 ', expectedValid: false, expectedError: 'Must be "1" or "0"' },
    { input: '0  ', expectedValid: false, expectedError: 'Must be "1" or "0"' },
    { input: ' 1 0', expectedValid: false, expectedError: 'Must be "1" or "0"' }
  ]

  // Validation Tests
  describe('validate', () => {
    test.each(testCases)('validates correctly for input: $input', ({ input, expectedValid, expectedError }) => {
      const record: IRecord = { class: RecordClassEnum.Main, data: input }
      const isValid = validator.validate(record, { raiseError: false })

      expect(isValid).toBe(expectedValid)
      if (!expectedValid) {
        expect(validator.hasErrors()).toBe(true)
        expect(validator.getErrors()).toContain(expectedError)
      } else {
        expect(validator.hasErrors()).toBe(false)
      }
    })

    test('throws error when raiseError is true', () => {
      const record: IRecord = { class: RecordClassEnum.Main, data: 'invalid' }
      expect(() => validator.validate(record, { raiseError: true })).toThrow('Must be "1" or "0"')
    })

    test('does not throw error when raiseError is false', () => {
      const record: IRecord = { class: RecordClassEnum.Main, data: 'invalid' }
      expect(() => validator.validate(record, { raiseError: false })).not.toThrow()
    })
  })

  // Normalization Tests
  describe('normalize', () => {
    const normalizationCases = [
      { input: '  1   ', expected: '1' }, // Whitespace should be trimmed now
      { input: '0  ', expected: '0' },
      { input: '123', expected: '123' },
    ]

    test.each(normalizationCases)('normalizes "$input" to "$expected"', ({ input, expected }) => {
      const record: IRecord = { class: RecordClassEnum.Main, data: input }
      const normalizedRecord = validator.normalize(record)
      expect(normalizedRecord.data).toBe(expected)
    })
  })

  // Rules Test
  describe('rules', () => {
    test('has rules object', () => {
      expect(validator.rules).toEqual({ maxLength: 1})
    })
  })
})
