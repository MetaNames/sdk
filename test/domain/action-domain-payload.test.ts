import { Buffer } from 'buffer'
import { actionDomainMintPayload } from '../../src/actions'
import { IActionDomainMintPayload } from '../../src/interface'
import { config } from '../helpers'


test('payload for action domain mint', async () => {
  const expectedHex = '09000000096e616d652e6d657461000000000000000000000000000000000000000000000000000000000000000100000001'

  const params: IActionDomainMintPayload = {
    domain: 'name.meta',
    to: Buffer.alloc(21),
    subscriptionYears: 1,
    byocTokenId: 0
  }
  const contract = await config.metaNames.contract.getContract()
  const data = actionDomainMintPayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})
