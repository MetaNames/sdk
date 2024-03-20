import { mainNetConfig } from "./config/mainnet"
import { testNetConfig } from "./config/testnet"

export type BYOCSymbol = 'POLYGON_USDC' | 'TEST_COIN' | 'ETH_GOERLI' | 'ETHEREUM_USDT' | 'MATIC' | 'ETH' | 'BNB'

export interface BYOC {
  address: string
  id: number
  symbol: BYOCSymbol
  decimals: number
}

export interface Config {
  cache_ttl: number,
  tld: string,
  tlds: string[],
  hasProxyContract: boolean,
  contractAddress: string,
  rpcConfig: {
    urlBaseGlobal: { url: string, shard_id: number },
    urlBaseShards: { url: string, shard_id: number }[],
  },
  byoc: BYOC[]
}

export interface ConfigOverrides extends Partial<Config> {}

export enum Enviroment {
  testnet = 'testnet',
  mainnet = 'mainnet',
}

export class ConfigProvider {
  enviroment: Enviroment

  constructor(enviroment: Enviroment) {
    const environmentList: Enviroment[] = Object.values(Enviroment)

    if (!environmentList.includes(enviroment))
      throw new Error(`Invalid environment: ${enviroment}`)

    this.enviroment = enviroment
  }

  resolve() {
    switch (this.enviroment) {
      case Enviroment.testnet:
        return testNetConfig
      case Enviroment.mainnet:
        return mainNetConfig
    }
  }
}
