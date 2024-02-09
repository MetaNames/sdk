import { IActionDomainMint, IRecord, RecordClassEnum } from '../../src/interface'
import { Domain } from '../../src/models'
import { config, generateRandomString } from '../helpers'

const domainName = `${generateRandomString(15)}.meta`

let domain: Domain
let subDomain: Domain | undefined

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
  const domainToInteract = subDomain || domain
  const { transactionHash, fetchResult } = await domainToInteract.getRecordRepository(config.metaNames).delete(RecordClassEnum.Wallet)
  const resultDelete = await fetchResult

  expect(resultDelete).toBeDefined()
  if (resultDelete) {
    expect(transactionHash).toBeDefined()
    expect(transactionHash).toBe(resultDelete.transactionHash)
    expect(resultDelete.hasError).toBe(false)
    expect(resultDelete.eventTrace.length).toBeGreaterThan(0)

    subDomain = undefined
  }
}, 10_000)


test('action record mint', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await domain.getRecordRepository(config.metaNames).create(actionMintRecord)
  const resultMintRecord = await fetchResult

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) {
    expect(transactionHash).toBeDefined()
    expect(transactionHash).toBe(resultMintRecord.transactionHash)
    expect(resultMintRecord.hasError).toBe(false)
    expect(resultMintRecord.eventTrace.length).toBeGreaterThan(0)
  }
}, 10_000)

test('action record mint with parent', async () => {
  const subdomain = generateRandomString(15)
  const parentDomain = domainName

  const randomActionMint: IActionDomainMint = {
    domain: subdomain,
    parentDomain,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { fetchResult: subDomainMint } = await config.metaNames.domainRepository.register(randomActionMint)
  const subDomainMintResult = await subDomainMint

  expect(subDomainMintResult.hasError).toBe(false)
  expect(subDomainMintResult.eventTrace.length).toBeGreaterThan(0)

  subDomain = await config.metaNames.domainRepository.find(`${subdomain}.${parentDomain}`) as Domain

  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await subDomain.getRecordRepository(config.metaNames).create(actionMintRecord)
  const resultMintRecord = await fetchResult

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) {
    expect(transactionHash).toBeDefined()
    expect(transactionHash).toBe(resultMintRecord.transactionHash)
    expect(resultMintRecord.hasError).toBe(false)
    expect(resultMintRecord.eventTrace.length).toBeGreaterThan(0)
  }
}, 20_000)

test('action record update', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await domain.getRecordRepository(config.metaNames).create(actionMintRecord)
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
  const { transactionHash: updateTransactionHash, fetchResult: fetchUpdateResult } = await domain.getRecordRepository(config.metaNames).update(actionUpdateRecord)
  const resultUpdateRecord = await fetchUpdateResult

  expect(resultUpdateRecord).toBeDefined()
  if (resultUpdateRecord) {
    expect(updateTransactionHash).toBeDefined()
    expect(updateTransactionHash).toBe(resultUpdateRecord.transactionHash)
    expect(resultUpdateRecord.hasError).toBe(false)
    expect(resultUpdateRecord.eventTrace.length).toBeGreaterThan(0)
  }
}, 15_000)
