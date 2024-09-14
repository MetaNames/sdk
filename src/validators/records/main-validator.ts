import { IRecord, IValidatorInterface, IValidatorOptions } from "../../interface"
import { BaseValidator } from "../base-validator"

export class MainRecordValidator extends BaseValidator implements IValidatorInterface<IRecord> {
  get rules() {
    return {
      maxLength: 1
    }
  }
  validation(record: IRecord, options?: IValidatorOptions): boolean {
    const data = record.data.toString()
    if (!data) this.addError('Value is required')

    const validValues = ['1', '0']
    if (!validValues.includes(data)) this.addError('Must be "1" or "0"')

    if (options?.raiseError) this.raiseErrors()

    return !this.hasErrors()
  }

  normalize(record: IRecord): IRecord {
    const data = record.data.toString().trim()
    record.data = data

    return record
  }
}
