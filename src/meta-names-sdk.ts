import { ContractRepository, DomainRepository } from './repositories'
import { Config, ConfigProvider, Enviroment } from './providers'
import { MetaNamesContractRepository } from './repositories/contracts/meta-names-contract-repository'
import { SecretsProvider } from './providers/secrets'
import { SigningClassType, SigningStrategyType } from './interface'

/**
 * Meta Names SDK
 */
export class MetaNamesSdk {
  config: Config
  contract: MetaNamesContractRepository
  contractRepository: ContractRepository
  domainRepository: DomainRepository
  secrets: SecretsProvider

  constructor(environment: Enviroment = Enviroment.testnet, overrideConfig?: Config) {
    this.config = overrideConfig ?? new ConfigProvider(environment).resolve()
    this.secrets = new SecretsProvider()

    this.contractRepository = new ContractRepository(this.config.rpcConfig, environment, this.secretsResolver)
    this.contract = new MetaNamesContractRepository(this.config.contractAddress, this.config.rpcConfig, environment, this.secretsResolver)

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

  private secretsResolver() {
    return this.secrets
  }
}
