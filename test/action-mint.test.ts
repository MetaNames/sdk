import { Buffer } from 'buffer'
import { actionMintPayload } from '../src/actions'
import { testNetConfig } from '../src/config'
import { MetaNamesContract } from '../src/contract'
import { IActionMint } from '../src/interface'
import { config, generateRandomString } from './helper'

test('payload for action mint', async () => {
  const expectedHex = '09000000096e616d652e6d6574610000000000000000000000000000000000000000000000'

  const params: IActionMint = {
    domain: 'name.meta',
    to: Buffer.alloc(21),
    token_uri: undefined,
    parent_id: undefined,
  }
  const fileAbi = await config.metaNamesContract.getFileAbi()
  const data = actionMintPayload(fileAbi.contract, params)

  expect(data.toString('hex')).toBe(expectedHex)
})

test('run action mint', async () => {

  const randomActionMint: IActionMint = {
    domain: `${generateRandomString(15)}.meta`,
    to: config.address,
    token_uri: undefined,
    parent_id: undefined,
  }
  console.log(`mint domain: ${randomActionMint.domain}`)
  const result = await config.metaNamesContract.actionMint(config.privateKey, randomActionMint)

  expect(result.isFinalOnChain).toBe(true)
  expect(result.hasError).toBe(false)
}, 10_000)
