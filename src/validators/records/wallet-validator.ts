import { RegexRecordValidator } from './regex-validator'

export class WalletRecordValidator extends RegexRecordValidator {
  protected getRegexError(): string {
    return 'Invalid wallet format'
  }

  getRegexPattern(): RegExp {
    return /[0-9a-f]{42}/
  }

  protected getMaxLength(): number {
    return 42
  }
}
