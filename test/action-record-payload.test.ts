import { actionRecordDeletePayload, actionRecordMintPayload, actionRecordUpdatePayload } from '../src/actions'
import { IActionRecordDelete, IActionRecordMint, IActionRecordUpdate, RecordClassEnum } from '../src/interface'
import { config } from './helpers'

test('payload for action record mint', async () => {
  const expectedHex = '21000000096e616d652e6d657461040000002a303033373363363864666564393939616563343030363331393465326433653038373066393839336262'

  const params: IActionRecordMint = {
    domain: 'name.meta',
    class: RecordClassEnum.Wallet,
    data: '00373c68dfed999aec40063194e2d3e0870f9893bb'
  }
  const fileAbi = await config.metaNamesContract.getFileAbi()
  const data = actionRecordMintPayload(fileAbi.contract, params)

  expect(data.toString('hex')).toBe(expectedHex)
})

test('payload for action record update', async () => {
  const expectedHex = '22000000096e616d652e6d657461040000002a303033373363363864666564393939616563343030363331393465326433653038373066393839336263'

  const params: IActionRecordUpdate = {
    domain: 'name.meta',
    class: RecordClassEnum.Wallet,
    data: '00373c68dfed999aec40063194e2d3e0870f9893bc'
  }
  const fileAbi = await config.metaNamesContract.getFileAbi()
  const data = actionRecordUpdatePayload(fileAbi.contract, params)

  expect(data.toString('hex')).toBe(expectedHex)
})


test('payload for action delete record', async () => {
  const expectedHex = '23000000096e616d652e6d65746104'

  const params: IActionRecordDelete = {
    domain: 'name.meta',
    class: RecordClassEnum.Wallet,
  }
  const fileAbi = await config.metaNamesContract.getFileAbi()
  const data = actionRecordDeletePayload(fileAbi.contract, params)

  expect(data.toString('hex')).toBe(expectedHex)
})
