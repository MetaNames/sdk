import { IRecord, RecordClassEnum } from "../../../src"
import { TwitterRecordValidator } from "../../../src/validators/records/twitter-validator"

describe('TwitterRecordValidator', () => {
  let validator: TwitterRecordValidator

  beforeEach(() => {
    validator = new TwitterRecordValidator()
  })

  describe('validate', () => {
    const validUsernames = [
      'user',
      '@user',
      'user123',
      'user_name',
      'USER',
      '_user_',
      '123user',
      'a'.repeat(15),
    ]

    const invalidUsernames = [
      'user name',
      'user-name',
      'user.name',
      '@user@name',
      'user!',
      'user?',
      '@',
      '@@@',
    ]

    test.each(validUsernames)('should pass for valid username: %s', (username) => {
      const record: IRecord = { class: RecordClassEnum.Twitter, data: username }
      expect(validator.validate(record)).toBe(true)
      expect(validator.hasErrors()).toBe(false)
    })

    test.each(invalidUsernames)('should fail for invalid username: %s', (username) => {
      const record: IRecord = { class: RecordClassEnum.Twitter, data: username }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Invalid Twitter username format')
    })

    test('should fail for username exceeding maxLength', () => {
      const record: IRecord = { class: RecordClassEnum.Twitter, data: 'a'.repeat(16) }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Record data is too long')
    })
  })

  describe('getRegexError', () => {
    test('should return correct error message', () => {
      expect(validator.getRegexError()).toBe('Invalid Twitter username format')
    })
  })

  describe('getRegexPattern', () => {
    test('should return correct regex pattern', () => {
      expect(validator.getRegexPattern()).toEqual(/^@?(\w{1,15})$/)
    })
  })

  describe('getMaxLength', () => {
    test('should return correct max length', () => {
      expect(validator.getMaxLength()).toBe(15)
    })
  })

  describe('rules', () => {
    test('should have correct maxLength', () => {
      expect(validator.rules.maxLength).toBe(15)
    })

    test('should have correct regex pattern', () => {
      expect(validator.rules.pattern).toEqual(/^@?(\w{1,15})$/)
    })
  })
})
