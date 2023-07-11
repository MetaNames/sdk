import { actionMintRecordPayload } from '../src/actions'
import { IActionMint, IActionMintRecord, RecordClassEnum } from '../src/interface'
import { config, generateRandomString } from './helper'

test('payload for action mint record', async () => {
  const expectedHex = '21000000096e616d652e6d657461040000002a303033373363363864666564393939616563343030363331393465326433653038373066393839336262'

  const params: IActionMintRecord = {
    domain: 'name.meta',
    class: RecordClassEnum.Wallet,
    data: '00373c68dfed999aec40063194e2d3e0870f9893bb'
  }
  const fileAbi = await config.metaNamesContract.getFileAbi()
  const data = actionMintRecordPayload(fileAbi.contract, params)

  expect(data.toString('hex')).toBe(expectedHex)
})

test('run action mint', async () => {
  const domain = `${generateRandomString(15)}.meta`
  const randomActionMint: IActionMint = {
    domain,
    to: config.address,
    token_uri: undefined,
    parent_id: undefined,
  }
  const resultMint = await config.metaNamesContract.actionMint(config.privateKey, randomActionMint)
  expect(resultMint.isFinalOnChain).toBe(true)
  expect(resultMint.hasError).toBe(false)

  const actionMintRecord: IActionMintRecord = {
    domain,
    class: RecordClassEnum.Wallet,
    data: config.address
  }
  const resultMintRecord = await config.metaNamesContract.actionMintRecord(config.privateKey, actionMintRecord)
  expect(resultMintRecord.isFinalOnChain).toBe(true)
  expect(resultMintRecord.hasError).toBe(false)
}, 20_000)
