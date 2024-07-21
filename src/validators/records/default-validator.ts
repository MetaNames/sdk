import { IRecord, IValidatorInterface, IValidatorOptions, RecordClassEnum } from '../../interface'

export class DefaultRecordValidator implements IValidatorInterface<IRecord> {
  #errors: string[] = []

  hasErrors() {
    return this.#errors.length > 0
  }

  getErrors() {
    return this.#errors
  }

  protected addError(error: string) {
    this.#errors.push(error)
  }

  get rules() {
    return {
      maxLength: 64
    }
  }

  validate(record: IRecord, { raiseError }: IValidatorOptions = { raiseError: true }): boolean {
    this.#errors = []

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

  protected raiseErrors() {
    if (this.#errors.length > 0) throw new Error(this.getErrors().join(', '))
  }
}
