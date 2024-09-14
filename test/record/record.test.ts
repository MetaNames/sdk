import { RecordClassEnum } from '../../src/interface'
import { Domain } from '../../src/models'
import { config, mintDomain } from '../helpers'

const domainName = 'name.mpc'
let domain: Domain

beforeAll(async () => {
  const domainOpt = await config.sdk.domainRepository.find(domainName)
  if (!domainOpt) await mintDomain(domainName)

  domain = await config.sdk.domainRepository.find(domainName) as Domain

  for (const record of recordsTestArray) {
    // Mint the record if it doesn't exist
    const existingRecord = await domain.getRecordRepository(config.sdk).find(record.recordClass)
    if (!existingRecord) await domain.getRecordRepository(config.sdk).create({ class: record.recordClass, data: record.initialValue })
  }
}, 15_000)

// Ensure all RecordClassEnum values are present
const allRecordClasses = Object.values(RecordClassEnum)
  .filter(value => typeof value === 'number') as RecordClassEnum[]

const recordsTestArray: { recordClass: RecordClassEnum, initialValue: any, updatedValue: any }[] = [
  { recordClass: RecordClassEnum.Bio, initialValue: 'hello there', updatedValue: 'hello world' },
  { recordClass: RecordClassEnum.Price, initialValue: '1000', updatedValue: '2000' },
  { recordClass: RecordClassEnum.Wallet, initialValue: config.address, updatedValue: config.address2 },
  { recordClass: RecordClassEnum.Discord, initialValue: 'my_discord', updatedValue: 'my_updated_discord' },
  { recordClass: RecordClassEnum.Twitter, initialValue: 'my_twitter', updatedValue: 'my_new_twitter' },
  { recordClass: RecordClassEnum.Uri, initialValue: 'https://app.metanames.app', updatedValue: 'https://metanam.es' },
  { recordClass: RecordClassEnum.Avatar, initialValue: 'avatar', updatedValue: 'avatar 2' },
  { recordClass: RecordClassEnum.Email, initialValue: 'metanames@proton.me', updatedValue: 'metanames2@proton.me' },
]

describe('lookup domain records', () => {
  for (const record of recordsTestArray) {
    test(`lookup domain record for ${RecordClassEnum[record.recordClass]}`, async () => {
      const recordValue = await domain.getRecordRepository(config.sdk).find(record.recordClass)
      expect(recordValue).toBeDefined()
    })
  }
})

describe('update domain records', () => {
  for (const record of recordsTestArray) {
    test(`update domain record for ${RecordClassEnum[record.recordClass]}`, async () => {
      // Ensure the value we are using for the update differs
      const recordValue = await domain.getRecordRepository(config.sdk).find(record.recordClass)
      const valueToUpdate = recordValue == record.updatedValue ? record.initialValue : record.updatedValue

      // Update the record value
      const { fetchResult } = await domain.getRecordRepository(config.sdk).update({ class: record.recordClass, data: valueToUpdate })
      const result = await fetchResult
      expect(result.hasError).toBeFalsy()

      // Fetch the updated record and verify the change
      domain = await config.sdk.domainRepository.find(domainName) as Domain
      const updatedData = await domain.getRecordRepository(config.sdk).find(record.recordClass)
      expect(updatedData).toEqual(valueToUpdate)
    }, 10_000)
  }
})
