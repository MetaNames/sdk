import { RecordClassEnum } from '../../src/interface'
import { config, mintDomain, mintRecord } from '../helpers'

const domainName = 'name.meta'
const recordClass = RecordClassEnum.Wallet
const recordValue = '00373c68dfed999aec39063194e2d3e0870f9899fa'

beforeAll(async () => {
  const domain = await config.metaNames.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)

  const record = await (await config.metaNames.domainRepository.find(domainName))?.recordRepository.find(recordClass)
  if (!record) await mintRecord(domainName, recordClass, recordValue)
}, 15_000)

test('lookup domain record', async () => {
  const data = await (await config.metaNames.domainRepository.find(domainName))?.recordRepository.find(recordClass)

  expect(data).toBe(recordValue)
})

test('lookup domain record with non existent record', async () => {
  const data = await (await config.metaNames.domainRepository.find(domainName))?.recordRepository.find(RecordClassEnum.Twitter)

  expect(data).toBeNull()
})
