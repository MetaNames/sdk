import assert from 'assert'
import { Buffer } from 'buffer'
import dotenv from 'dotenv'
import { actionMintPayload } from '../src/actions'
import { testNetConfig } from '../src/config'
import { MetaNamesContract } from '../src/contract'
import { IActionMint } from '../src/interface'

const expectedHex = '09000000096e616d652e6d65746100000000000000000000000000000000000000000000'

const metaNamesContract = new MetaNamesContract(testNetConfig.contractAddress, testNetConfig.rpcConfig)

function generateRandomString(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

const main = async () => {
  // Test payload
  const params: IActionMint = {
    token_id: 'name.meta',
    to: Buffer.alloc(21),
    parent: undefined,
  }
  const fileAbi = await metaNamesContract.getFileAbi()
  const data = actionMintPayload(fileAbi.contract, params)
  assert(data.toString('hex') === expectedHex, 'Action Mint Arg is not as expected')

  // Test mint domain
  dotenv.config()
  const privateKey = process.env.PRIVATE_KEY
  if (!privateKey) throw new Error('PRIVATE_KEY is not set')

  const address = Buffer.from('00373c68dfed999aec39063194e2d3e0870f9899fa', 'hex')
  const randomActionMint: IActionMint = {
    token_id: `${generateRandomString(15)}.meta`,
    to: address,
    parent: undefined,
  }
  console.log(`mint domain: ${randomActionMint.token_id}`)
  const result = await metaNamesContract.actionMint(privateKey, randomActionMint)
  if (result) console.log(`trx hash: ${result.trxHash}`)
  assert(result.isFinalOnChain, 'Action Mint failed')
  assert(result.hasError == false, 'Action Mint failed')
}

main()
