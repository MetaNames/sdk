import { actionRecordDeletePayload, actionRecordMintPayload, actionRecordUpdatePayload } from '../../src/actions'
import { IActionRecordDelete, IActionRecordMint, IActionRecordUpdate, RecordClassEnum } from '../../src/interface'
import { config } from '../helpers'

const domain = 'name.mpc'

test('payload for action record mint', async () => {
  const expectedHex = '21000000086e616d652e6d7063040000002a303033373363363864666564393939616563343030363331393465326433653038373066393839336262'

  const params: IActionRecordMint = {
    domain,
    class: RecordClassEnum.Wallet,
    data: '00373c68dfed999aec40063194e2d3e0870f9893bb'
  }
  const contract = await config.sdk.contract.getContract()
  const data = actionRecordMintPayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})

test('payload for action record update', async () => {
  const expectedHex = '22000000086e616d652e6d7063040000002a303033373363363864666564393939616563343030363331393465326433653038373066393839336263'

  const params: IActionRecordUpdate = {
    domain,
    class: RecordClassEnum.Wallet,
    data: '00373c68dfed999aec40063194e2d3e0870f9893bc'
  }
  const contract = await config.sdk.contract.getContract()
  const data = actionRecordUpdatePayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})


test('payload for action delete record', async () => {
  const expectedHex = '23000000086e616d652e6d706304'

  const params: IActionRecordDelete = {
    domain,
    class: RecordClassEnum.Wallet,
  }
  const contract = await config.sdk.contract.getContract()
  const data = actionRecordDeletePayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})
