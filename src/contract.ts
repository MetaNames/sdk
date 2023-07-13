import { IPartisiaRpcConfig } from 'partisia-rpc/lib/main/accountInfo'
import { ContractRepository } from './repositories/contract-repository'
import { DomainRepository } from './repositories/domain-repository'

export class MetaNamesContract {
  private contractRepository: ContractRepository
  private domainRepository: DomainRepository

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig) {
    this.contractRepository = new ContractRepository(contractAddress, rpc)
    this.domainRepository = new DomainRepository(this.contractRepository)
  }

  setPrivateKey(privateKey?: string) {
    this.contractRepository.setPrivateKey(privateKey)
  }

  getDomainRepository(): DomainRepository {
    return this.domainRepository
  }
}
