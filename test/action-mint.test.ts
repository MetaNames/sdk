import { Buffer } from 'buffer'
import dotenv from 'dotenv'
import { actionMintPayload } from '../src/actions'
import { testNetConfig } from '../src/config'
import { MetaNamesContract } from '../src/contract'
import { IActionMint } from '../src/interface'
import { generateRandomString } from './helper'

test('payload for action mint', async () => {
  const expectedHex = '09000000096e616d652e6d6574610000000000000000000000000000000000000000000000'

  const metaNamesContract = new MetaNamesContract(testNetConfig.contractAddress, testNetConfig.rpcConfig)
  const params: IActionMint = {
    domain: 'name.meta',
    to: Buffer.alloc(21),
    token_uri: undefined,
    parent_id: undefined,
  }
  const fileAbi = await metaNamesContract.getFileAbi()
  const data = actionMintPayload(fileAbi.contract, params)

  expect(data.toString('hex')).toBe(expectedHex)
})

test('run action mint', async () => {
  const metaNamesContract = new MetaNamesContract(testNetConfig.contractAddress, testNetConfig.rpcConfig)
  const address = Buffer.from('00373c68dfed999aec39063194e2d3e0870f9899fa', 'hex')

  // Load .env
  dotenv.config()
  const privateKey = `${process.env.TEST_PRIVATE_KEY}`
  if (!privateKey) throw new Error('TEST_PRIVATE_KEY is not set')

  const randomActionMint: IActionMint = {
    domain: `${generateRandomString(15)}.meta`,
    to: address,
    token_uri: undefined,
    parent_id: undefined,
  }
  console.log(`mint domain: ${randomActionMint.domain}`)
  const result = await metaNamesContract.actionMint(privateKey, randomActionMint)

  expect(result.isFinalOnChain).toBe(true)
  expect(result.hasError).toBe(false)
}, 10_000)
