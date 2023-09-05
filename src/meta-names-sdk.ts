import { ContractRepository, DomainRepository } from './repositories'
import { Config, ConfigProvider, Enviroment } from './providers'
import { MetaNamesContractRepository } from './repositories/contracts/meta-names-contract-repository'
import PartisiaSdk from 'partisia-sdk'

/**
 * Meta Names SDK
 */
export class MetaNamesSdk {
  config: Config
  contract: MetaNamesContractRepository
  contractRepository: ContractRepository
  domainRepository: DomainRepository

  constructor(environment: Enviroment = Enviroment.testnet, overrideConfig?: Config) {
    this.config = overrideConfig ?? new ConfigProvider(environment).resolve()

    this.contractRepository = new ContractRepository(this.config.rpcConfig)
    this.contract = new MetaNamesContractRepository(this.config.contractAddress, this.config.rpcConfig)

    this.domainRepository = new DomainRepository(this.contractRepository, this.contract, this.config)
  }

  /**
   * Set the strategy to sign transactions
   * @param strategy Signing strategy
   * @param value The value of the strategy
   */
  setSigningStrategy(strategy: 'privateKey' | 'partisiaSdk', value: string | PartisiaSdk) {
    this.resetSigningStrategy()

    if (strategy === 'privateKey') {
      if (typeof value !== 'string') throw new Error('Private key must be a string')

      this.setPrivateKey(value)
    } else this.setPartisiaSdk(value as PartisiaSdk)
  }

  /**
   * Reset the signing strategy
   */
  resetSigningStrategy() {
    this.setPrivateKey()
    this.setPartisiaSdk()
  }

  private setPrivateKey(privateKey?: string) {
    this.contractRepository.setPrivateKey(privateKey)
    this.contract.setPrivateKey(privateKey)
  }

  private setPartisiaSdk(partisiaSdk?: PartisiaSdk) {
    this.contractRepository.setPartisiaSdk(partisiaSdk)
    this.contract.setPartisiaSdk(partisiaSdk)
  }
}
