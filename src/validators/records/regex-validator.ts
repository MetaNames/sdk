import { IRecord, IValidatorOptions } from '../../interface'
import { DefaultRecordValidator } from './default-validator'

export abstract class RegexRecordValidator extends DefaultRecordValidator {
  get rules() {
    return {
      maxLength: this.getMaxLength(),
      pattern: this.getRegexPattern()
    }
  }

  validate(record: IRecord, options: IValidatorOptions = { raiseError: true }): boolean {
    if (!super.validate(record, options)) return false

    const data = record.data.toString()
    if (!this.rules.pattern.test(data)) this.getErrors().push(this.getRegexError())

    if (options.raiseError) this.raiseErrors()

    return !this.hasErrors()
  }

  normalize(record: IRecord): IRecord {
    record.data = record.data.toString().toLowerCase().trim()

    return record
  }

  protected abstract getRegexError(): string
  protected abstract getRegexPattern(): RegExp
  protected getMaxLength(): number {
    return 64
  }
}
