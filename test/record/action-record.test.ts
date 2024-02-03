import { IActionDomainMint, IRecord, RecordClassEnum } from '../../src/interface'
import { Domain } from '../../src/models'
import { config, generateRandomString } from '../helpers'

const domainName = `${generateRandomString(15)}.meta`

let domain: Domain

beforeAll(async () => {
  const randomActionMint: IActionDomainMint = {
    domain: domainName,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { transactionHash, fetchResult } = await config.metaNames.domainRepository.register(randomActionMint)
  const resultMint = await fetchResult

  expect(transactionHash).toBeDefined()
  expect(transactionHash).toBe(resultMint.transactionHash)
  expect(resultMint.hasError).toBe(false)
  expect(resultMint.eventTrace.length).toBeGreaterThan(0)

  domain = await config.metaNames.domainRepository.find(domainName) as Domain
}, 10_000)

afterEach(async () => {
  const { transactionHash, fetchResult } = await domain.recordRepository.delete(RecordClassEnum.Wallet)
  const resultDelete = await fetchResult

  expect(resultDelete).toBeDefined()
  if (resultDelete) {
    expect(transactionHash).toBeDefined()
    expect(transactionHash).toBe(resultDelete.transactionHash)
    expect(resultDelete.hasError).toBe(false)
    expect(resultDelete.eventTrace.length).toBeGreaterThan(0)
  }
}, 10_000)


test('action record mint', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await domain.recordRepository.create(actionMintRecord)
  const resultMintRecord = await fetchResult

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) {
    expect(transactionHash).toBeDefined()
    expect(transactionHash).toBe(resultMintRecord.transactionHash)
    expect(resultMintRecord.hasError).toBe(false)
    expect(resultMintRecord.eventTrace.length).toBeGreaterThan(0)
  }
}, 10_000)

test('action record update', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await domain.recordRepository.create(actionMintRecord)
  const resultMintRecord = await fetchResult

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) {
    expect(transactionHash).toBeDefined()
    expect(transactionHash).toBe(resultMintRecord.transactionHash)
    expect(resultMintRecord.hasError).toBe(false)
    expect(resultMintRecord.eventTrace.length).toBeGreaterThan(0)
  }

  const actionUpdateRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: generateRandomString(40)
  }
  const { transactionHash: updateTransactionHash, fetchResult: fetchUpdateResult } = await domain.recordRepository.update(actionUpdateRecord)
  const resultUpdateRecord = await fetchUpdateResult

  expect(resultUpdateRecord).toBeDefined()
  if (resultUpdateRecord) {
    expect(updateTransactionHash).toBeDefined()
    expect(updateTransactionHash).toBe(resultUpdateRecord.transactionHash)
    expect(resultUpdateRecord.hasError).toBe(false)
    expect(resultUpdateRecord.eventTrace.length).toBeGreaterThan(0)
  }
}, 15_000)
