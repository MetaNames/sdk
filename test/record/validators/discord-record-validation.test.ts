import { IRecord, RecordClassEnum } from "../../../src"
import { DiscordRecordValidator } from "../../../src/validators/records/discord-validator"

describe('DiscordRecordValidator', () => {
  let validator: DiscordRecordValidator

  beforeEach(() => {
    validator = new DiscordRecordValidator()
  })

  describe('validate', () => {
    test('should pass for valid Discord username', () => {
      const validUsernames = ['a', 'user123', 'valid_user', 'user.name', 'a.b.c', 'user_123.test']
      validUsernames.forEach(username => {
        const record: IRecord = { class: RecordClassEnum.Discord, data: username }
        expect(validator.validate(record)).toBe(true)
        expect(validator.hasErrors()).toBe(false)
      })
    })

    test('should pass for single character username', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: 'a' }
      expect(validator.validate(record)).toBe(true)
      expect(validator.hasErrors()).toBe(false)
    })

    test('should fail for empty username', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: '' }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Record data is required')
    })

    test('should fail for username longer than 32 characters', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: 'a'.repeat(33) }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Record data is too long')
    })

    test('should fail for username with invalid characters', () => {
      const invalidUsernames = ['invalid@user', 'USER123', 'user-name', 'user name']
      invalidUsernames.forEach(username => {
        const record: IRecord = { class: RecordClassEnum.Discord, data: username }
        expect(validator.validate(record, { raiseError: false })).toBe(false)
        expect(validator.getErrors()).toContain('Invalid Discord username format')
      })
    })

    test('should fail for username with adjacent periods', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: 'user..name' }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Invalid Discord username format')
    })

    test('should fail for username starting or ending with period or underscore', () => {
      const invalidUsernames = ['.username', '_username', 'username.', 'username_']
      invalidUsernames.forEach(username => {
        const record: IRecord = { class: RecordClassEnum.Discord, data: username }
        expect(validator.validate(record, { raiseError: false })).toBe(false)
        expect(validator.getErrors()).toContain('Invalid Discord username format')
      })
    })

    test('should throw error when raiseError is true', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: 'invalid@user' }
      expect(() => validator.validate(record)).toThrow('Invalid Discord username format')
    })

    test('should not throw error when raiseError is false', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: 'invalid@user' }
      expect(() => validator.validate(record, { raiseError: false })).not.toThrow()
    })
  })

  describe('normalize', () => {
    test('should lowercase and trim string data', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: '  VALID_USER123  ' }
      const normalized = validator.normalize(record)
      expect(normalized.data).toBe('valid_user123')
    })
  })

  describe('rules', () => {
    test('should have correct maxLength', () => {
      expect(validator.rules.maxLength).toBe(32)
    })

    test('should have correct regex pattern', () => {
      expect(validator.rules.pattern).toEqual(/^(?!.*\.\.)(?=[a-z0-9._]{1,32}$)[a-z0-9]+([._][a-z0-9]+)*$/)
    })
  })

  describe('error handling', () => {
    test('hasErrors should return true when errors exist', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: '' }
      validator.validate(record, { raiseError: false })
      expect(validator.hasErrors()).toBe(true)
    })

    test('getErrors should return all errors', () => {
      const record: IRecord = { class: RecordClassEnum.Discord, data: '' }
      validator.validate(record, { raiseError: false })
      expect(validator.getErrors()).toEqual(['Record data is required'])
    })
  })
})
