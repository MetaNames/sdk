import { IRecord, RecordClassEnum } from "../../../src"
import { DefaultRecordValidator } from "../../../src/validators/records/default-validator"

describe('DefaultRecordValidator', () => {
  let validator: DefaultRecordValidator

  beforeEach(() => {
    validator = new DefaultRecordValidator()
  })

  describe('validate', () => {
    test('should pass for valid record', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: 'Valid data' }
      expect(validator.validate(record)).toBe(true)
      expect(validator.hasErrors()).toBe(false)
    })

    test('should fail for empty data', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: '' }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.hasErrors()).toBe(true)
      expect(validator.getErrors()).toContain('Record data is required')
    })

    test('should fail for non-number class', () => {
      const record: IRecord = { class: 'invalid' as any, data: 'Valid data' }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Record class is required')
    })

    test('should fail for data exceeding max length', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: 'a'.repeat(65) }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Record data is too long')
    })

    test('should fail for invalid record class', () => {
      const record: IRecord = { class: 999, data: 'Valid data' } as any
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Record class is invalid')
    })

    test('should throw error when raiseError is true', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: '' }
      expect(() => validator.validate(record)).toThrow('Record data is required')
    })

    test('should not throw error when raiseError is false', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: '' }
      expect(() => validator.validate(record, { raiseError: false })).not.toThrow()
    })
  })

  describe('normalize', () => {
    test('should trim string data', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: '  trimmed  ' }
      const normalized = validator.normalize(record)
      expect(normalized.data).toBe('trimmed')
    })

    test('should not modify non-string data', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: 123 as any }
      const normalized = validator.normalize(record)
      expect(normalized.data).toBe(123)
    })
  })

  describe('rules', () => {
    test('should have correct maxLength', () => {
      expect(validator.rules.maxLength).toBe(64)
    })
  })

  describe('error handling', () => {
    test('hasErrors should return true when errors exist', () => {
      const record: IRecord = { class: RecordClassEnum.Bio, data: '' }
      validator.validate(record, { raiseError: false })
      expect(validator.hasErrors()).toBe(true)
    })

    test('getErrors should return all errors', () => {
      const record: IRecord = { class: 'invalid' as any, data: '' }
      validator.validate(record, { raiseError: false })
      expect(validator.getErrors()).toEqual([
        'Record data is required',
        'Record class is required',
        'Record class is invalid'
      ])
    })
  })
})
