import dotenv from 'dotenv'
import { Enviroment } from '../../src/providers'
import { MetaNames } from '../../src/meta-names'

// Load .env
dotenv.config()
const privateKey = `${process.env.TEST_PRIVATE_KEY}`
if (!privateKey) throw new Error('TEST_PRIVATE_KEY is not set')

const metaNamesContract = new MetaNames(Enviroment.testnet)
metaNamesContract.setPrivateKey(privateKey)

export const config = {
  address: Buffer.from('00373c68dfed999aec39063194e2d3e0870f9899fa', 'hex'),
  metaNames: metaNamesContract,
}
