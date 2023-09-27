import { IDomain, IMetaNamesContractRepository } from "../interface"
import { RecordRepository } from "../repositories"

/**
 * Domain model that wraps the IDomain interface
 */
export class Domain implements IDomain {
  private domain: IDomain
  private contractRepository: IMetaNamesContractRepository

  constructor(domain: IDomain, contractRepository: IMetaNamesContractRepository) {
    this.domain = domain
    this.contractRepository = contractRepository
  }

  get name() {
    return this.nameWithoutTLD + '.meta'
  }

  get nameWithoutTLD() {
    return this.domain.name.split('.').reverse().join('.')
  }

  get owner() {
    return this.domain.owner
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
    return new RecordRepository(this.contractRepository, this)
  }
}
