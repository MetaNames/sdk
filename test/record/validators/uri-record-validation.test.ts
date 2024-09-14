import { IRecord, RecordClassEnum } from "../../../src"
import { UriRecordValidator } from "../../../src/validators/records/uri-validator"

describe('UriRecordValidator', () => {
  let validator: UriRecordValidator

  beforeEach(() => {
    validator = new UriRecordValidator()
  })

  describe('validate', () => {
    const validURIs = [
      'http://www.example.com',
      'https://example.com/path/to/page',
      'ftp://ftp.example.com/file.txt',
      'mailto:user@example.com',
      'file:///C:/path/to/file.txt',
      'git://github.com/user/repo.git',
      'ws://example.com/socket',
      'http://localhost:8080',
      'https://example.com:8443',
      'http://example.com/?query=param',
      'https://example.com/path#fragment',
      'http://example.com/path?query=param#fragment',
      'http://user:pass@example.com',
      'http://192.168.0.1',
      'http://[2001:db8::1]',
      'custom-scheme://example/path',
    ]

    const invalidURIs = [
      '',
      'just a string',
      'http://',
      'http:/',
      'http',
      '://example.com',
      'http://:8080',
      'http://example.com:abc',
      'http:// example.com',
      'http//example.com',
    ]

    test.each(validURIs)('should pass for valid URI: %s', (uri) => {
      const record: IRecord = { class: RecordClassEnum.Uri, data: uri }
      expect(validator.validate(record, { raiseError: false })).toBe(true)
      expect(validator.hasErrors()).toBe(false)
    })

    test.each(invalidURIs)('should fail for invalid URI: %s', (uri) => {
      const record: IRecord = { class: RecordClassEnum.Uri, data: uri }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Invalid URI format')
    })
  })

  describe('error handling', () => {
    test('should throw error when raiseError is true', () => {
      const record: IRecord = { class: RecordClassEnum.Uri, data: 'invalid-uri' }
      expect(() => validator.validate(record, { raiseError: true })).toThrow('Invalid URI format')
    })

    test('should not throw error when raiseError is false', () => {
      const record: IRecord = { class: RecordClassEnum.Uri, data: 'invalid-uri' }
      expect(() => validator.validate(record, { raiseError: false })).not.toThrow()
    })
  })

  describe('normalize', () => {
    const normalizationCases = [
      {
        input: 'http://example.com/',
        expected: 'http://example.com'
      },
      {
        input: '  https://www.example.com/path/  ',
        expected: 'https://www.example.com/path'
      },
      {
        input: 'http://Example.COM',
        expected: 'http://example.com'
      },
      {
        input: 'http://example.com:80',
        expected: 'http://example.com'
      },
      {
        input: 'https://example.com:443',
        expected: 'https://example.com'
      },
      {
        input: 'http://example.com/path/to/resource/',
        expected: 'http://example.com/path/to/resource'
      },
      {
        input: 'http://example.com?query=param',
        expected: 'http://example.com/?query=param'
      },
      {
        input: 'http://example.com/#fragment',
        expected: 'http://example.com/#fragment'
      },
      {
        input: 'mailto:user@example.com',
        expected: 'mailto:user@example.com'
      },
      {
        input: 'file:///C:/path/to/file.txt',
        expected: 'file:///C:/path/to/file.txt'
      }
    ]

    test.each(normalizationCases)('should normalize "$input" to "$expected"', ({ input, expected }) => {
      const record: IRecord = { class: RecordClassEnum.Uri, data: input }
      const normalizedRecord = validator.normalize(record)
      expect(normalizedRecord.data).toBe(expected)
    })

    test('should throw an error for invalid URIs', () => {
      const record: IRecord = { class: RecordClassEnum.Uri, data: 'invalid-uri' }
      expect(() => validator.normalize(record)).toThrow('Invalid URL')
    })
  })
})
