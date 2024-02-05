import { Buffer } from 'buffer'
import { actionDomainMintPayload, actionDomainRenewalPayload } from '../../src/actions'
import { IActionDomainMintPayload, IActionRenewDomainPayload } from '../../src/interface'
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

test('payload for action domain renew', async () => {
  const expectedHex = '26000000096e616d652e6d657461000000000000000000373c68dfed999aec39063194e2d3e0870f9899fa00000001'

  const params: IActionRenewDomainPayload = {
    domain: 'name.meta',
    subscriptionYears: 1,
    payer: config.address,
    byocTokenId: 0
  }
  const contract = await config.metaNames.contract.getContract()
  const data = actionDomainRenewalPayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})
