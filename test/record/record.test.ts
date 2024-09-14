import { RecordClassEnum } from '../../src/interface'
import { Domain } from '../../src/models'
import { config, mintDomain, mintRecord } from '../helpers'

const domainName = 'name.mpc'
const recordClass = RecordClassEnum.Price
const recordValue = '1000'
let domain: Domain

beforeAll(async () => {
  const domainOpt = await config.sdk.domainRepository.find(domainName)
  if (!domainOpt) await mintDomain(domainName)

  domain = await config.sdk.domainRepository.find(domainName) as Domain

  const record = await domain.getRecordRepository(config.sdk).find(recordClass)
  if (!record) await mintRecord(domainName, recordClass, recordValue)
}, 15_000)

test('lookup domain record', async () => {
  const data = await domain.getRecordRepository(config.sdk).find(recordClass)

  expect(data).toBe(recordValue)
})

test('lookup domain record with non existent record', async () => {
  const data = await domain.getRecordRepository(config.sdk).find(RecordClassEnum.Twitter)

  expect(data).toBeNull()
})
