import { ContractRepository, DomainRepository } from './repositories'
import { Config, ConfigProvider, Enviroment } from './providers'
import { MetaNamesContractRepository } from './repositories/contracts/meta-names-contract-repository'
import PartisiaSdk from 'partisia-sdk'
import { SecretsProvider } from './providers/secrets'

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
    SecretsProvider.getInstance().setSigningStrategy(strategy, value)
  }

  /**
   * Reset the signing strategy
   */
  resetSigningStrategy() {
    SecretsProvider.getInstance().resetSigningStrategy()
  }
}
