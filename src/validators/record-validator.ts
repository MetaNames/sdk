import { IRecord, IValidatorInterface, IValidatorOptions, RecordClassEnum } from '../interface'
import { DefaultRecordValidator } from './records/default-validator'
import { DiscordRecordValidator } from './records/discord-validator'
import { EmailRecordValidator } from './records/email-validator'
import { TwitterRecordValidator } from './records/twitter-validator'
import { UriRecordValidator } from './records/uri-validator'
import { WalletRecordValidator } from './records/wallet-validator'

const recordValidatorFactory: { [key: number]: IValidatorInterface<IRecord> } = {}

export function getRecordValidator(record: IRecord): IValidatorInterface<IRecord> {
  let cachedValidator = recordValidatorFactory[record.class]
  if (cachedValidator) return cachedValidator

  switch (record.class) {
    case RecordClassEnum.Bio:
    case RecordClassEnum.Avatar:
      cachedValidator = new DefaultRecordValidator()
      break
    case RecordClassEnum.Discord:
      cachedValidator = new DiscordRecordValidator()
      break
    case RecordClassEnum.Email:
      cachedValidator = new EmailRecordValidator()
      break
    case RecordClassEnum.Twitter:
      cachedValidator = new TwitterRecordValidator()
      break
    case RecordClassEnum.Uri:
      cachedValidator = new UriRecordValidator()
      break
    case RecordClassEnum.Wallet:
      cachedValidator = new WalletRecordValidator()
      break
    default:
      throw new Error('Record class is invalid')
  }

  recordValidatorFactory[record.class] = cachedValidator

  return cachedValidator
}
