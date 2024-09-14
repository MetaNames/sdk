import { RecordClassEnum, getRecordValidator, IRecord } from "../../src"
import { DefaultRecordValidator } from "../../src/validators/records/default-validator"
import { DiscordRecordValidator } from "../../src/validators/records/discord-validator"
import { EmailRecordValidator } from "../../src/validators/records/email-validator"
import { TwitterRecordValidator } from "../../src/validators/records/twitter-validator"
import { UriRecordValidator } from "../../src/validators/records/uri-validator"
import { WalletRecordValidator } from "../../src/validators/records/wallet-validator"

describe('Record Validator Factory', () => {
  test('returns DefaultRecordValidator for Bio record', () => {
    const record: IRecord = { class: RecordClassEnum.Bio, data: 'bio data' }
    const validator = getRecordValidator(record)
    expect(validator).toBeInstanceOf(DefaultRecordValidator)
  })

  test('returns DefaultRecordValidator for Avatar record', () => {
    const record: IRecord = { class: RecordClassEnum.Avatar, data: 'avatar data' }
    const validator = getRecordValidator(record)
    expect(validator).toBeInstanceOf(DefaultRecordValidator)
  })

  test('returns DiscordRecordValidator for Discord record', () => {
    const record: IRecord = { class: RecordClassEnum.Discord, data: 'discord data' }
    const validator = getRecordValidator(record)
    expect(validator).toBeInstanceOf(DiscordRecordValidator)
  })

  test('returns EmailRecordValidator for Email record', () => {
    const record: IRecord = { class: RecordClassEnum.Email, data: 'email@example.com' }
    const validator = getRecordValidator(record)
    expect(validator).toBeInstanceOf(EmailRecordValidator)
  })

  test('returns TwitterRecordValidator for Twitter record', () => {
    const record: IRecord = { class: RecordClassEnum.Twitter, data: '@twitterhandle' }
    const validator = getRecordValidator(record)
    expect(validator).toBeInstanceOf(TwitterRecordValidator)
  })

  test('returns UriRecordValidator for Uri record', () => {
    const record: IRecord = { class: RecordClassEnum.Uri, data: 'https://example.com' }
    const validator = getRecordValidator(record)
    expect(validator).toBeInstanceOf(UriRecordValidator)
  })

  test('returns WalletRecordValidator for Wallet record', () => {
    const record: IRecord = { class: RecordClassEnum.Wallet, data: '0x1234567890123456789012345678901234567890' }
    const validator = getRecordValidator(record)
    expect(validator).toBeInstanceOf(WalletRecordValidator)
  })

  test('throws error for invalid record class', () => {
    const record: IRecord = { class: 999, data: 'invalid' } as any
    expect(() => getRecordValidator(record)).toThrow('Record class is invalid')
  })

  test('caches and returns the same validator instance for the same record class', () => {
    const record1: IRecord = { class: RecordClassEnum.Bio, data: 'bio1' }
    const record2: IRecord = { class: RecordClassEnum.Bio, data: 'bio2' }

    const validator1 = getRecordValidator(record1)
    const validator2 = getRecordValidator(record2)

    expect(validator1).toBe(validator2)
  })

  test('returns different validator instances for different record classes', () => {
    const bioRecord: IRecord = { class: RecordClassEnum.Bio, data: 'bio' }
    const emailRecord: IRecord = { class: RecordClassEnum.Email, data: 'email@example.com' }

    const bioValidator = getRecordValidator(bioRecord)
    const emailValidator = getRecordValidator(emailRecord)

    expect(bioValidator).not.toBe(emailValidator)
  })
})
