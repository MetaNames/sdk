import { RecordClassEnum } from '../src/interface'
import { config, mintDomain, mintRecord } from './helpers'

const domainName = 'name.meta'
const recordClass = RecordClassEnum.Wallet
const recordValue = '00373c68dfed999aec39063194e2d3e0870f9899fa'

beforeAll(async () => {
  try {
    await config.metaNamesContract.domainRepository.find(domainName)
  } catch (e) {
    await mintDomain(domainName)
  }
  try {
    await (await config.metaNamesContract.domainRepository.find(domainName)).recordRepository.find(recordClass)
  } catch (e) {
    await mintRecord(domainName, recordClass, recordValue)
  }
}, 15_000)

test('lookup domain record', async () => {
  const data = await (await config.metaNamesContract.domainRepository.find(domainName)).recordRepository.find(recordClass)

  expect(data).toBe(recordValue)
})

test('lookup domain record with non existent record', async () => {
  await expect((await config.metaNamesContract.domainRepository.find(domainName)).recordRepository.find(RecordClassEnum.Twitter)).rejects.toThrow('Record not found')
})
