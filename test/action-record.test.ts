import { IActionDomainMint, IActionRecordMint, IActionRecordUpdate, RecordClassEnum } from '../src/interface'
import { config, generateRandomString } from './helpers'

const domain = `${generateRandomString(15)}.meta`

beforeAll(async () => {
  const randomActionMint: IActionDomainMint = {
    domain,
    to: config.address,
    token_uri: undefined,
    parent_domain: undefined,
  }
  const resultMint = await config.metaNamesContract.domainMint(config.privateKey, randomActionMint)
  expect(resultMint.isFinalOnChain).toBe(true)
  expect(resultMint.hasError).toBe(false)
}, 10_000)

afterEach(async () => {
  const resultDelete = await config.metaNamesContract.recordDelete(config.privateKey, {
    domain,
    class: RecordClassEnum.Wallet
  })
  expect(resultDelete.isFinalOnChain).toBe(true)
  expect(resultDelete.hasError).toBe(false)
}, 10_000)


test('action record mint', async () => {
  const actionMintRecord: IActionRecordMint = {
    domain,
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const resultMintRecord = await config.metaNamesContract.recordMint(config.privateKey, actionMintRecord)
  expect(resultMintRecord.isFinalOnChain).toBe(true)
  expect(resultMintRecord.hasError).toBe(false)
}, 10_000)

test('action record update', async () => {
  const actionMintRecord: IActionRecordMint = {
    domain,
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const resultMintRecord = await config.metaNamesContract.recordMint(config.privateKey, actionMintRecord)
  expect(resultMintRecord.isFinalOnChain).toBe(true)
  expect(resultMintRecord.hasError).toBe(false)

  const actionUpdateRecord: IActionRecordUpdate = {
    domain,
    class: RecordClassEnum.Wallet,
    data: generateRandomString(40)
  }
  const resultUpdateRecord = await config.metaNamesContract.recordUpdate(config.privateKey, actionUpdateRecord)
  expect(resultUpdateRecord.isFinalOnChain).toBe(true)
  expect(resultUpdateRecord.hasError).toBe(false)
}, 15_000)
