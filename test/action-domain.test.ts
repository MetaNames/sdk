import { Buffer } from 'buffer'
import { actionDomainMintPayload } from '../src/actions'
import { IActionDomainMint } from '../src/interface'
import { config, generateRandomString } from './helpers'

test('payload for action domain mint', async () => {
  const expectedHex = '09000000096e616d652e6d6574610000000000000000000000000000000000000000000000'

  const params: IActionDomainMint = {
    domain: 'name.meta',
    to: Buffer.alloc(21),
    token_uri: undefined,
    parent_domain: undefined,
  }
  const fileAbi = await config.metaNamesContract.getFileAbi()
  const data = actionDomainMintPayload(fileAbi.contract, params)

  expect(data.toString('hex')).toBe(expectedHex)
})

test('run action mint', async () => {
  const randomActionMint: IActionDomainMint = {
    domain: `${generateRandomString(15)}.meta`,
    to: config.address,
    token_uri: undefined,
    parent_domain: undefined,
  }
  const result = await config.metaNamesContract.domainMint(config.privateKey, randomActionMint)

  expect(result.isFinalOnChain).toBe(true)
  expect(result.hasError).toBe(false)
}, 10_000)
