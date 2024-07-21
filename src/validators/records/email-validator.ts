import { RegexRecordValidator } from './regex-validator'

export class EmailRecordValidator extends RegexRecordValidator {
  getRegexError(): string {
    return 'Invalid email format'
  }

  getRegexPattern(): RegExp {
    return /^[a-zA-Z0-9]((?!\.{2})[a-zA-Z0-9._%+-])*[a-zA-Z0-9]?@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z]{1,})+$/
  }
}
