import { IActionDomainMint, IActionRecordMint, IActionRecordUpdate, RecordClassEnum } from '../src/interface'
import { config, generateRandomString } from './helpers'

const domainName = `${generateRandomString(15)}.meta`

beforeAll(async () => {
  const randomActionMint: IActionDomainMint = {
    domain: domainName,
    to: config.address,
    token_uri: undefined,
    parent_domain: undefined,
  }
  const resultMint = await config.metaNamesContract.domainRepository.mint(randomActionMint)
  expect(resultMint.isFinalOnChain).toBe(true)
  expect(resultMint.hasError).toBe(false)
}, 10_000)

afterEach(async () => {
  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  const resultDelete = await config.metaNamesContract.domainRepository.getRecordsRepository(domain).delete({
    domain: domainName,
    class: RecordClassEnum.Wallet
  })
  expect(resultDelete.isFinalOnChain).toBe(true)
  expect(resultDelete.hasError).toBe(false)
}, 10_000)


test('action record mint', async () => {
  const actionMintRecord: IActionRecordMint = {
    domain: domainName,
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  const resultMintRecord = await config.metaNamesContract.domainRepository.getRecordsRepository(domain).mint(actionMintRecord)
  expect(resultMintRecord.isFinalOnChain).toBe(true)
  expect(resultMintRecord.hasError).toBe(false)
}, 10_000)

test('action record update', async () => {
  const actionMintRecord: IActionRecordMint = {
    domain: domainName,
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  const resultMintRecord = await config.metaNamesContract.domainRepository.getRecordsRepository(domain).mint(actionMintRecord)
  expect(resultMintRecord.isFinalOnChain).toBe(true)
  expect(resultMintRecord.hasError).toBe(false)

  const actionUpdateRecord: IActionRecordUpdate = {
    domain: domainName,
    class: RecordClassEnum.Wallet,
    data: generateRandomString(40)
  }
  const resultUpdateRecord = await config.metaNamesContract.domainRepository.getRecordsRepository(domain).update(actionUpdateRecord)
  expect(resultUpdateRecord.isFinalOnChain).toBe(true)
  expect(resultUpdateRecord.hasError).toBe(false)
}, 15_000)
