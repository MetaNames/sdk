import { IActionDomainMint, IRecord, RecordClassEnum } from '../../src/interface'
import { Domain } from '../../src/models'
import { config, generateRandomString, generateWalletAddress, verifyTransactionResult } from '../helpers'

const domainName = `${generateRandomString(15)}.mpc`

let domain: Domain
let subDomain: Domain | undefined

beforeAll(async () => {
  const randomActionMint: IActionDomainMint = {
    domain: domainName,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { transactionHash, fetchResult } = await config.sdk.domainRepository.register(randomActionMint)
  const resultMint = await fetchResult

  verifyTransactionResult(transactionHash, resultMint)

  domain = await config.sdk.domainRepository.find(domainName) as Domain
}, 15_000)

afterEach(async () => {
  const domainToInteract = subDomain || domain
  const { transactionHash, fetchResult } = await domainToInteract.getRecordRepository(config.sdk).delete(RecordClassEnum.Wallet)
  const resultDelete = await fetchResult

  expect(resultDelete).toBeDefined()
  if (resultDelete) {
    verifyTransactionResult(transactionHash, resultDelete)

    subDomain = undefined
  }
}, 15_000)


test('action record mint', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await domain.getRecordRepository(config.sdk).create(actionMintRecord)
  const resultMintRecord = await fetchResult

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) verifyTransactionResult(transactionHash, resultMintRecord)
}, 15_000)

test('action record mint batch', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const actionMintRecord2: IRecord = {
    class: RecordClassEnum.Twitter,
    data: 'handle'
  }
  const { transactionHash, fetchResult } = await domain.getRecordRepository(config.sdk).createBatch([actionMintRecord, actionMintRecord2])
  const recordMintBatchResult = await fetchResult

  expect(recordMintBatchResult).toBeDefined()
  if (recordMintBatchResult) verifyTransactionResult(transactionHash, recordMintBatchResult)
}, 15_000)

test('action record mint with parent', async () => {
  const subdomain = generateRandomString(15)
  const parentDomain = domainName

  const randomActionMint: IActionDomainMint = {
    domain: subdomain,
    parentDomain,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { fetchResult: subDomainMint } = await config.sdk.domainRepository.register(randomActionMint)
  const subDomainMintResult = await subDomainMint

  expect(subDomainMintResult.hasError).toBe(false)
  expect(subDomainMintResult.eventTrace.length).toBeGreaterThan(0)

  subDomain = await config.sdk.domainRepository.find(`${subdomain}.${parentDomain}`) as Domain

  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await subDomain.getRecordRepository(config.sdk).create(actionMintRecord)
  const resultMintRecord = await fetchResult

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) verifyTransactionResult(transactionHash, resultMintRecord)
}, 20_000)

test('action record update', async () => {
  const actionMintRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const { transactionHash, fetchResult } = await domain.getRecordRepository(config.sdk).create(actionMintRecord)
  const resultMintRecord = await fetchResult

  expect(resultMintRecord).toBeDefined()
  if (resultMintRecord) verifyTransactionResult(transactionHash, resultMintRecord)

  const actionUpdateRecord: IRecord = {
    class: RecordClassEnum.Wallet,
    data: generateWalletAddress()
  }
  const { transactionHash: updateTransactionHash, fetchResult: fetchUpdateResult } = await domain.getRecordRepository(config.sdk).update(actionUpdateRecord)
  const resultUpdateRecord = await fetchUpdateResult

  expect(resultUpdateRecord).toBeDefined()
  if (resultUpdateRecord) verifyTransactionResult(updateTransactionHash, resultUpdateRecord)
}, 15_000)
