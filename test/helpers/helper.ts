import { IActionDomainMint, IRecord, ITransactionResult, RecordClassEnum } from '../../src/interface'
import { config } from './config'

export const generateRandomString = (length: number): string => {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

export const mintDomain = async (domain: string) => {
  const randomActionMint: IActionDomainMint = {
    domain,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }

  await config.sdk.domainRepository.register(randomActionMint)
}

export const mintRecord = async (domainName: string, recordClass: RecordClassEnum, data: string) => {
  const actionMintRecord: IRecord = {
    class: recordClass,
    data,
  }

  const domain = await config.sdk.domainRepository.find(domainName)
  await domain?.getRecordRepository(config.sdk).create(actionMintRecord)
}


export const verifyTransactionResult = (hash: string, result: ITransactionResult) => {
  expect(hash).toBeDefined()
  expect(hash).toBe(result.transactionHash)
  expect(result.hasError).toBe(false)
  expect(result.eventTrace.length).toBeGreaterThan(0)
}
