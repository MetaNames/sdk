import { ContractRepository, DomainRepository } from './repositories'
import { Config, ConfigProvider, Enviroment } from './providers'
import { MetaNamesContractRepository } from './repositories/contracts/meta-names-contract-repository'

/**
 * Meta Names SDK
 */
export class MetaNames {
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

  setPrivateKey(privateKey?: string) {
    this.contractRepository.setPrivateKey(privateKey)
    this.contract.setPrivateKey(privateKey)
  }
}
