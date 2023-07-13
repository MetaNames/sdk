import { IActionDomainMint, IActionRecordMint, RecordClassEnum } from '../../src/interface'
import { config } from './config'

export const generateRandomString = (length: number): string => {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
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
    token_uri: undefined,
    parent_domain: undefined,
  }

  await config.metaNamesContract.domainRepository.mint(randomActionMint)
}

export const mintRecord = async (domainName: string, recordClass: RecordClassEnum, data: string) => {
  const actionMintRecord: IActionRecordMint = {
    domain: domainName,
    class: recordClass,
    data,
  }

  const domain = await config.metaNamesContract.domainRepository.find(domainName)
  config.metaNamesContract.domainRepository.getRecordsRepository(domain).mint(actionMintRecord)
}

