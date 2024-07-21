import { IRecord, RecordClassEnum } from "../../../src"
import { WalletRecordValidator } from "../../../src/validators/records/wallet-validator"

describe('WalletRecordValidator', () => {
  let validator: WalletRecordValidator

  beforeEach(() => {
    validator = new WalletRecordValidator()
  })

  describe('validate', () => {
    const validWallets = [
      '0058bf2d2fb789910e8a188612c95ff89d600a7945',
      '0058bf3a4c5d6e7f8901234567890abcdef1234513',
      '0058bf3a4c5d6e7f8901234567890abcdef1234512'
    ]

    const invalidWallets = [
      '0123456789abcdef0123456789abcdef0123456', // 41 characters
      '0123456789abcdef0123456789abcdef012345678', // 43 characters
      '0123456789abcdef0123456789abcdef0123456G', // invalid character
      '0123456789ABCDEF0123456789ABCDEF01234567', // uppercase not allowed
      ' 0123456789abcdef0123456789abcdef01234567', // leading space
      '0123456789abcdef0123456789abcdef01234567 ', // trailing space
      'not a wallet address'
    ]

    test.each(validWallets)('should pass for valid wallet: %s', (wallet) => {
      const record: IRecord = { class: RecordClassEnum.Wallet, data: wallet }
      expect(validator.validate(record, { raiseError: false })).toBe(true)
      expect(validator.hasErrors()).toBe(false)
    })

    test.each(invalidWallets)('should fail for invalid wallet: %s', (wallet) => {
      const record: IRecord = { class: RecordClassEnum.Wallet, data: wallet }
      expect(validator.validate(record, { raiseError: false })).toBe(false)
      expect(validator.getErrors()).toContain('Invalid wallet format')
    })
  })

  describe('error handling', () => {
    test('should throw error when raiseError is true', () => {
      const record: IRecord = { class: RecordClassEnum.Wallet, data: 'invalid-wallet' }
      expect(() => validator.validate(record, { raiseError: true })).toThrow('Invalid wallet format')
    })

    test('should not throw error when raiseError is false', () => {
      const record: IRecord = { class: RecordClassEnum.Wallet, data: 'invalid-wallet' }
      expect(() => validator.validate(record, { raiseError: false })).not.toThrow()
    })
  })

  describe('getRegexPattern', () => {
    test('should return the correct regex pattern', () => {
      expect(validator.getRegexPattern()).toEqual(/[0-9a-f]{42}/)
    })
  })

  describe('getRegexError', () => {
    test('should return the correct error message', () => {
      expect(validator['getRegexError']()).toBe('Invalid wallet format')
    })
  })
})
