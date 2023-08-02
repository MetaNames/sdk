import { IPartisiaRpcConfig } from 'partisia-rpc/lib/main/accountInfo'
import { ContractRepository } from './repositories/contract-repository'
import { DomainRepository } from './repositories/domain-repository'
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

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig, environment: Enviroment = Enviroment.testnet) {
    this.config = new ConfigProvider(environment).resolve()

    this.contractRepository = new ContractRepository(rpc)
    this.contract = new MetaNamesContractRepository(contractAddress, rpc)

    this.domainRepository = new DomainRepository(this.contractRepository, this.contract, this.config)
  }

  setPrivateKey(privateKey?: string) {
    this.contractRepository.setPrivateKey(privateKey)
    this.contract.setPrivateKey(privateKey)
  }
}
