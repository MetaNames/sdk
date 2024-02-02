import { mainNetConfig } from "./config/mainnet"
import { testNetConfig } from "./config/testnet"

export type BYOCSymbol = 'POLYGON_USDC' | 'TEST_COIN' | 'ETH_GOERLI'

export interface BYOC {
  address: string
  id: number
  symbol: BYOCSymbol
  rounding: number
}

export interface Config {
  tld: string,
  contractAddress: string,
  rpcConfig: {
    urlBaseGlobal: { url: string, shard_id: number },
    urlBaseShards: { url: string, shard_id: number }[],
  },
  byoc: BYOC[]
}

export enum Enviroment {
  // eslint-disable-next-line no-unused-vars
  testnet = 'testnet',
  // eslint-disable-next-line no-unused-vars
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
