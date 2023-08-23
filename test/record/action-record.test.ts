import { IActionDomainMint, IRecord, RecordClassEnum } from '../../src/interface'
import { Domain } from '../../src/models'
import { config, generateRandomString } from '../helpers'

const domainName = `${generateRandomString(15)}.meta`

let domain: Domain

beforeAll(async () => {
  const randomActionMint: IActionDomainMint = {
    domain: domainName,
    to: config.address,
  }
  const resultMint = await config.metaNames.domainRepository.mint(randomActionMint)
  expect(resultMint.isFinalOnChain).toBe(true)
  expect(resultMint.hasError).toBe(false)

  domain = await config.metaNames.domainRepository.find(domainName) as Domain
}, 10_000)

afterEach(async () => {
  const resultDelete = await domain.recordRepository.delete(RecordClassEnum.Wallet)

  expect(resultDelete).toBeDefined()
  if (resultDelete) {
    expect(resultDelete.isFinalOnChain).toBe(true)
    expect(resultDelete.hasError).toBe(false)
  }
}, 10_000)


test('action record mint', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const resultMintRecord = await domain.recordRepository.mint(actionMintRecord)

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) {
    expect(resultMintRecord.isFinalOnChain).toBe(true)
    expect(resultMintRecord.hasError).toBe(false)
  }
}, 10_000)

test('action record update', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const resultMintRecord = await domain.recordRepository.mint(actionMintRecord)

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) {
    expect(resultMintRecord.isFinalOnChain).toBe(true)
    expect(resultMintRecord.hasError).toBe(false)
  }

  const actionUpdateRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: generateRandomString(40)
  }
  const resultUpdateRecord = await domain.recordRepository.update(actionUpdateRecord)

  expect(resultUpdateRecord).toBeDefined()
  if (resultUpdateRecord) {
    expect(resultUpdateRecord.isFinalOnChain).toBe(true)
    expect(resultUpdateRecord.hasError).toBe(false)
  }
}, 15_000)
