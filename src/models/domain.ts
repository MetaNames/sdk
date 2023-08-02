import { IDomain, IMetaNamesContractRepository } from "../interface"
import { RecordRepository } from "../repositories/record-repository"

/**
 * Domain model that wraps the IDomain interface
 */
export class Domain implements IDomain {
  domain: IDomain
  contractRepository: IMetaNamesContractRepository

  constructor(domain: IDomain, contractRepository: IMetaNamesContractRepository) {
    this.domain = domain
    this.contractRepository = contractRepository
  }

  get name() {
    return this.domain.name
  }

  get tokenId() {
    return this.domain.tokenId
  }

  get parentId() {
    return this.domain.parentId
  }

  get records() {
    return this.domain.records
  }

  get recordRepository(): RecordRepository {
    return new RecordRepository(this.contractRepository, this.domain)
  }
}
