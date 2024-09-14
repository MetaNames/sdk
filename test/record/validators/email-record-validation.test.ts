import { IRecord, RecordClassEnum } from "../../../src"
import { EmailRecordValidator } from "../../../src/validators/records/email-validator"

describe('EmailRecordValidator', () => {
  let validator: EmailRecordValidator

  beforeEach(() => {
    validator = new EmailRecordValidator()
  })

  describe('validate', () => {
    const validEmails = [
      'user@example.com',
      'user.name@example.co.uk',
      'user+tag@example.com',
      'user123@example.com',
      'user-name@example.com',
      'user_name@example.com',
      '123@example.com',
      'email@example.web',
      'user@subdomain.example.com',
      'user+alias@example.com',
      'user+alias@sub.domain.co.uk',
      'very.common@example.com',
      'disposable.style.email.with+symbol@example.com',
      'other.email-with-hyphen@example.com',
      'fully-qualified-domain@example.com',
      'user.name+tag+sorting@example.com',
      'x@example.com',
      'example-indeed@strange-example.com',
      'example@s.example',
      'a@a.a'
    ]

    const invalidEmails = [
      'plainaddress',
      '#@%^%#$@#$@#.com',
      '@example.com',
      'Joe Smith <email@example.com>',
      'email.example.com',
      'email@example@example.com',
      '.email@example.com',
      'email..email@example.com',
      'email@example.com (Joe Smith)',
      'email@example',
      'email@-example.com',
      'email@111.222.333.44444',
      'email@example..com',
      'Abc..123@example.com',
      '"(),:;<>[]@example.com',
      'just"not"right@example.com',
      'this\\ is"really"not\\allowed@example.com',
      'user@example.com\n',
      '\nuser@example.com',
      'user@exam\nple.com'
    ]

    test.each(validEmails)('should pass for valid email: %s', (email) => {
      const record: IRecord = { class: RecordClassEnum.Email, data: email }
      expect(validator.validate(record)).toBe(true)
      expect(validator.hasErrors()).toBe(false)
    })

    test.each(invalidEmails)('should fail for invalid email: %s', (email) => {
      const record: IRecord = { class: RecordClassEnum.Email, data: email }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Invalid email format')
    })

    test('should throw error when raiseError is true', () => {
      const record: IRecord = { class: RecordClassEnum.Email, data: 'invalid@' }
      expect(() => validator.validate(record)).toThrow('Invalid email format')
    })

    test('should not throw error when raiseError is false', () => {
      const record: IRecord = { class: RecordClassEnum.Email, data: 'invalid@' }
      expect(() => validator.validate(record, { raiseError: false })).not.toThrow()
    })
  })

  describe('normalize', () => {
    test('should lowercase and trim string data', () => {
      const record: IRecord = { class: RecordClassEnum.Email, data: '  USER@EXAMPLE.COM  ' }
      const normalized = validator.normalize(record)
      expect(normalized.data).toBe('user@example.com')
    })
  })

  describe('rules', () => {
    test('should have correct maxLength', () => {
      expect(validator.rules.maxLength).toBe(64)
    })

    test('should have correct regex pattern', () => {
      expect(validator.rules.pattern).toEqual(/^[a-zA-Z0-9]((?!\.{2})[a-zA-Z0-9._%+-])*[a-zA-Z0-9]?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{1,})+$/)
    })
  })

  describe('error handling', () => {
    test('hasErrors should return true when errors exist', () => {
      const record: IRecord = { class: RecordClassEnum.Email, data: 'invalid@' }
      validator.validate(record, { raiseError: false })
      expect(validator.hasErrors()).toBe(true)
    })

    test('getErrors should return all errors', () => {
      const record: IRecord = { class: RecordClassEnum.Email, data: 'invalid@' }
      validator.validate(record, { raiseError: false })
      expect(validator.getErrors()).toEqual(['Invalid email format'])
    })
  })
})
