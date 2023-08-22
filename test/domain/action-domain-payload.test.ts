import { Buffer } from 'buffer'
import { actionDomainMintPayload } from '../../src/actions'
import { IActionDomainMint } from '../../src/interface'
import { config } from '../helpers'


test('payload for action domain mint', async () => {
  const expectedHex = '09000000096e616d652e6d65746100000000000000000000000000000000000000000000000100000001'

  const params: IActionDomainMint = {
    domain: 'name.meta',
    to: Buffer.alloc(21),
    subscriptionYears: 1
  }
  const contract = await config.metaNames.contract.getContract()
  const data = actionDomainMintPayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})
