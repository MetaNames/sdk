import { testNetConfig } from "./config/testnet"

export interface Config {
  rpcConfig: {
    urlBaseGlobal: { url: string, shard_id: number },
    urlBaseShards: { url: string, shard_id: number }[],
  },
  byoc: {
    address: string,
    token: string,
  }
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
        throw new Error('Not implemented')
    }
  }
}
