import { ContractRepository, DomainRepository } from './repositories'
import { ConfigProvider, Enviroment } from './providers'
import type { Config, ConfigOverrides } from './providers'
import { MetaNamesContractRepository } from './repositories/contracts/meta-names-contract-repository'
import { SecretsProvider } from './providers/secrets'
import type { SigningClassType, SigningStrategyType } from './interface'
import { VERSION } from './version'

/**
 * Meta Names SDK
 */
export class MetaNamesSdk {
  config: Config
  contract: MetaNamesContractRepository
  contractRepository: ContractRepository
  domainRepository: DomainRepository
  secrets: SecretsProvider
  version: string = VERSION

  constructor(environment: Enviroment = Enviroment.testnet, overrideConfig?: ConfigOverrides) {
    const config = new ConfigProvider(environment).resolve()
    this.config = overrideConfig ? { ...config, ...overrideConfig } : config
    this.secrets = new SecretsProvider()

    this.contractRepository = new ContractRepository(this.config.rpcConfig, environment, this.secrets, this.config.cache_ttl)
    this.contract = new MetaNamesContractRepository(this.config.contractAddress, this.config.rpcConfig, environment, this.secrets, this.config.cache_ttl)

    this.domainRepository = new DomainRepository(this.contractRepository, this.contract, this.config)
  }

  /**
   * Set the strategy to sign transactions
   * @param strategy Signing strategy
   * @param value The value of the strategy
   */
  setSigningStrategy(strategy: SigningStrategyType, value: SigningClassType) {
    this.secrets.setSigningStrategy(strategy, value)
  }

  /**
   * Reset the signing strategy
   */
  resetSigningStrategy() {
    this.secrets.resetSigningStrategy()
  }
}
