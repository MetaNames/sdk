import { RegexRecordValidator } from './regex-validator'

export class TwitterRecordValidator extends RegexRecordValidator {
  getRegexError(): string {
    return 'Invalid Twitter username format'
  }

  getRegexPattern(): RegExp {
    return /^@?(\w{1,15})$/
  }

  getMaxLength(): number {
    return 15
  }
}
