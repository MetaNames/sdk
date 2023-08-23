import { IRecord, IValidatorInterface, IValidatorOptions, RecordClassEnum } from '../interface'

export class RecordValidator implements IValidatorInterface<IRecord> {
  errors: string[] = []

  get rules() {
    return {
      maxLength: 64
    }
  }

  validate(record: IRecord, { raiseError }: IValidatorOptions = { raiseError: true }): boolean {
    this.errors = []

    if (!record.data) this.errors.push('Record data is required')
    if (!record.class) this.errors.push('Record class is required')
    if (record.data.length > this.rules.maxLength) this.errors.push('Record data is too long')
    if (!(record.class in RecordClassEnum)) this.errors.push('Record class is invalid')

    if (raiseError && this.errors.length > 0) throw new Error(this.errors.join(', '))

    return this.errors.length === 0
  }

  // eslint-disable-next-line no-unused-vars
  normalize(record: IRecord, options: IValidatorOptions = { raiseError: true }): IRecord {
    return record
  }
}
