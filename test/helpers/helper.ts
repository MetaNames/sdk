import { IActionMint, IActionMintRecord, RecordClassEnum } from '../../src/interface'
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

export const mintDomainAndRecord = async (domain: string, recordClass: RecordClassEnum, data: string) => {
  const randomActionMint: IActionMint = {
    domain,
    to: config.address,
    token_uri: undefined,
    parent_domain: undefined,
  }
  await config.metaNamesContract.actionMint(config.privateKey, randomActionMint)

  const actionMintRecord: IActionMintRecord = {
    domain,
    class: recordClass,
    data,
  }
  await config.metaNamesContract.actionMintRecord(config.privateKey, actionMintRecord)
}

