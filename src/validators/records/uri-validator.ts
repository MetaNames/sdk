import { IRecord, IValidatorOptions } from '../../interface'
import { DefaultRecordValidator } from './default-validator'

export class UriRecordValidator extends DefaultRecordValidator {
  validation(record: IRecord, { raiseError }: IValidatorOptions = { raiseError: true }): boolean {
    try {
      const data = record.data.toString().trim()
      new URL(data)

    } catch (error) {
      this.addError('Invalid URI format')
    }

    if (raiseError) this.raiseErrors()

    return !this.hasErrors()
  }

  normalize(record: IRecord): IRecord {
    const data = record.data.toString().trim()
    record.data = new URL(data).toString().replace(/\/$/, '')

    return record
  }
}
