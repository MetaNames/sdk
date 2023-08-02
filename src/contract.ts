import { IPartisiaRpcConfig } from 'partisia-rpc/lib/main/accountInfo'
import { ContractRepository } from './repositories/contract-repository'
import { DomainRepository } from './repositories/domain-repository'
import { Config, ConfigProvider, Enviroment } from './providers'

export class MetaNamesContract {
  config: Config
  contractRepository: ContractRepository
  domainRepository: DomainRepository

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig, environment: Enviroment = Enviroment.testnet) {
    this.config = new ConfigProvider(environment).resolve()
    this.contractRepository = new ContractRepository(contractAddress, rpc)
    this.domainRepository = new DomainRepository(this.contractRepository, this.config)
  }

  setPrivateKey(privateKey?: string) {
    this.contractRepository.setPrivateKey(privateKey)
  }
}
