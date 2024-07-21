import { IRecord, IValidatorInterface, IValidatorOptions, RecordClassEnum } from '../../interface'
import { BaseValidator } from '../base-validator'

export class DefaultRecordValidator extends BaseValidator implements IValidatorInterface<IRecord> {
  get rules() {
    return {
      maxLength: 64
    }
  }

  validate(record: IRecord, { raiseError }: IValidatorOptions = { raiseError: true }): boolean {
    this.clearErrors()

    if (!record.data) this.addError('Record data is required')
    if (typeof record.class !== 'number') this.addError('Record class is required')
    if (record.data.length > this.rules.maxLength) this.addError('Record data is too long')
    if (!(record.class in RecordClassEnum)) this.addError('Record class is invalid')

    if (raiseError) this.raiseErrors()

    return !this.hasErrors()
  }

  normalize(record: IRecord): IRecord {
    if (typeof record.data === 'string')
      record.data = record.data.trim()

    return record
  }
}
