import { RegexRecordValidator } from './regex-validator'

export class DiscordRecordValidator extends RegexRecordValidator {
  getRegexError(): string {
    return 'Invalid Discord username format'
  }

  protected getRegexPattern() {
    return /^(?!.*\.\.)(?=[a-z0-9._]{1,32}$)[a-z0-9]+([._][a-z0-9]+)*$/
  }

  getMaxLength(): number {
    return 32
  }
}
