import dotenv from 'dotenv'
import { ConfigProvider, Enviroment, MetaNamesSdk } from '../../src'

// Load .env
dotenv.config()
const privateKey = `${process.env.TEST_PRIVATE_KEY}`
if (!privateKey) throw new Error('TEST_PRIVATE_KEY is not set')

const environment = Enviroment.testnet

const metaNamesSdk = new MetaNamesSdk(environment)
metaNamesSdk.setSigningStrategy('privateKey', privateKey)

export const config = {
  contract: new ConfigProvider(environment).resolve(),
  address: '00373c68dfed999aec39063194e2d3e0870f9899fa',
  address2: '000781799ad223c3561ce9c690ff66ead30f16a475',
  sdk: metaNamesSdk,
}
