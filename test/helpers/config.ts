import dotenv from 'dotenv'
import { ConfigProvider, Enviroment } from '../../src/providers'
import { MetaNamesContract } from '../../src/contract'

// Load .env
dotenv.config()
const privateKey = `${process.env.TEST_PRIVATE_KEY}`
if (!privateKey) throw new Error('TEST_PRIVATE_KEY is not set')

const Config = new ConfigProvider(Enviroment.testnet).resolve()
const contractAddress = '0264ca6a79ac3f6f01304c8f198529e160d9702fb9'
const metaNamesContract = new MetaNamesContract(contractAddress, Config.rpcConfig)
metaNamesContract.setPrivateKey(privateKey)

export const config = {
  address: Buffer.from('00373c68dfed999aec39063194e2d3e0870f9899fa', 'hex'),
  contractAddress,
  metaNamesContract,
}
