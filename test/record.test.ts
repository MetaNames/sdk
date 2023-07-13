import { RecordClassEnum } from '../src/interface'
import { config, mintDomain, mintRecord } from './helpers'

const domain = 'name.meta'
const recordClass = RecordClassEnum.Wallet
const recordValue = '00373c68dfed999aec39063194e2d3e0870f9899fa'

beforeAll(async () => {
  const data = await config.metaNamesContract.recordLookup(recordClass, domain)
  if (!data) {
    await mintDomain(domain)
    await mintRecord(domain, recordClass, recordValue)
  }
}, 15_000)

test('lookup domain record', async () => {
  const data = await config.metaNamesContract.recordLookup(recordClass, domain)
  expect(data).toBe(recordValue)
})

test('lookup domain record with invalid domain', async () => {
  await expect(config.metaNamesContract.recordLookup(recordClass, 'invalid')).rejects.toThrow('Domain not found')
})
