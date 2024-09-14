import { IRecord, IValidatorInterface, IValidatorOptions } from "../../interface"
import { BaseValidator } from "../base-validator"

export class PriceRecordValidator extends BaseValidator implements IValidatorInterface<IRecord> {
  get rules() {
    return {
      minPrice: 0,
      maxPrice: 1_000_000_000
    }
  }
  validate(record: IRecord, options?: IValidatorOptions): boolean {
    const data = record.data.toString().trim()
    if (!data) this.addError('Price is required')

    const price = Number(data)
    if (isNaN(price)) this.addError('Invalid price format')
    if (price < this.rules.minPrice) this.addError('Price is too low')
    if (price > this.rules.maxPrice) this.addError('Price is too high')

    if (options?.raiseError) this.raiseErrors()

    return !this.hasErrors()
  }

  normalize(record: IRecord): IRecord {
    const data = record.data.toString().trim()
    record.data = Number(data).toString()

    return record
  }
}
