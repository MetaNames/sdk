import { Buffer } from 'buffer'
import { actionDomainMintPayload, actionDomainRenewalPayload } from '../../src/actions'
import { IActionDomainMintPayload, IActionRenewDomainPayload } from '../../src/interface'
import { config } from '../helpers'

const domain = 'name.mpc'

test('payload for action domain mint', async () => {
  const expectedHex = '09000000086e616d652e6d7063000000000000000000000000000000000000000000000000000000000001000000086e616d652e6d7063000100000001'

  const params: IActionDomainMintPayload = {
    domain,
    to: Buffer.alloc(21),
    tokenUri: domain,
    subscriptionYears: 1,
    byocTokenId: 0
  }
  const contract = await config.sdk.contract.getContract({ partial: true })
  const data = actionDomainMintPayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})

test('payload for action domain renew', async () => {
  const expectedHex = '26000000086e616d652e6d7063000000000000000000373c68dfed999aec39063194e2d3e0870f9899fa00000001'

  const params: IActionRenewDomainPayload = {
    domain,
    subscriptionYears: 1,
    payer: config.address,
    byocTokenId: 0
  }
  const contract = await config.sdk.contract.getContract({ partial: true })
  const data = actionDomainRenewalPayload(contract.abi, params)

  expect(data.toString('hex')).toBe(expectedHex)
})
