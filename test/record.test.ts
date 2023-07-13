import { RecordClassEnum } from '../src/interface'
import { config, mintDomain, mintRecord } from './helpers'

const domainName = 'name.meta'
const recordClass = RecordClassEnum.Wallet
const recordValue = '00373c68dfed999aec39063194e2d3e0870f9899fa'

beforeAll(async () => {
  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  const data = await config.metaNamesContract.domainRepository.getRecordsRepository(domain).find(recordClass)
  if (!data) {
    await mintDomain(domainName)
    await mintRecord(domainName, recordClass, recordValue)
  }
}, 15_000)

test('lookup domain record', async () => {
  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  const data = await config.metaNamesContract.domainRepository.getRecordsRepository(domain).find(recordClass)
  expect(data).toBe(recordValue)
})

test('lookup domain record with non existent record', async () => {
  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  await expect(config.metaNamesContract.domainRepository.getRecordsRepository(domain).find(RecordClassEnum.Twitter)).rejects.toThrow('Record not found')
})
