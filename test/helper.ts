import dotenv from 'dotenv'
import { testNetConfig } from '../src/config'
import { MetaNamesContract } from '../src/contract'

export function generateRandomString(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

// Load .env
dotenv.config()
const privateKey = `${process.env.TEST_PRIVATE_KEY}`
if (!privateKey) throw new Error('TEST_PRIVATE_KEY is not set')

const contractAddress = '02642623bed956506fe9e366907ef10fa24c28ef1d'
export const config = {
  address: Buffer.from('00373c68dfed999aec39063194e2d3e0870f9899fa', 'hex'),
  contractAddress,
  metaNamesContract: new MetaNamesContract(contractAddress, testNetConfig.rpcConfig),
  privateKey,
}
