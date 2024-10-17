import { IRecord, IValidatorInterface, RecordClassEnum } from '../interface'
import { MainRecordValidator } from './records/main-validator'
import { DefaultRecordValidator } from './records/default-validator'
import { DiscordRecordValidator } from './records/discord-validator'
import { EmailRecordValidator } from './records/email-validator'
import { PriceRecordValidator } from './records/price-validator'
import { TwitterRecordValidator } from './records/twitter-validator'
import { UriRecordValidator } from './records/uri-validator'
import { WalletRecordValidator } from './records/wallet-validator'

const recordValidatorFactory: { [key: number]: IValidatorInterface<IRecord> } = {}

export function getRecordValidator(klass: RecordClassEnum): IValidatorInterface<IRecord> {
  let cachedValidator = recordValidatorFactory[klass]
  if (cachedValidator) return cachedValidator

  switch (klass) {
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
    case RecordClassEnum.Price:
      cachedValidator = new PriceRecordValidator()
      break
    case RecordClassEnum.Main:
      cachedValidator = new MainRecordValidator()
      break
    default:
      throw new Error('Record class is invalid')
  }

  recordValidatorFactory[klass] = cachedValidator

  return cachedValidator
}
