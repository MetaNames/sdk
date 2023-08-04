import { IRecord, IValidatorInterface, RecordClassEnum } from '../interface'

export default class RecordValidator implements IValidatorInterface<IRecord> {
  validate(record: IRecord): boolean {
    if (!record.data) throw new Error('Record data is required')
    if (!record.class) throw new Error('Record class is required')
    if (record.data.length > 64) throw new Error('Record data is too long')
    if (!(record.class in RecordClassEnum)) throw new Error('Record class is invalid')

    return true
  }

  normalize(record: IRecord): IRecord {
    return record
  }
}
