import { RecordClassEnum } from '../../src/interface'
import { Domain } from '../../src/models'
import { config, mintDomain, mintRecord } from '../helpers'

const domainName = 'name.meta'
const recordClass = RecordClassEnum.Wallet
const recordValue = '00373c68dfed999aec39063194e2d3e0870f9899fa'
let domain: Domain

beforeAll(async () => {
  const domainOpt = await config.metaNames.domainRepository.find(domainName)
  if (!domainOpt) await mintDomain(domainName)

  domain = await config.metaNames.domainRepository.find(domainName) as Domain

  const record = await domain.recordRepository.find(recordClass)
  if (!record) await mintRecord(domainName, recordClass, recordValue)
}, 15_000)

test('lookup domain record', async () => {
  const data = await domain.recordRepository.find(recordClass)

  expect(data).toBe(recordValue)
})

test('lookup domain record with non existent record', async () => {
  const data = await domain.recordRepository.find(RecordClassEnum.Twitter)

  expect(data).toBeNull()
})
