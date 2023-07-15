import { IContractRepository, IDomain } from "../interface"
import { RecordRepository } from "../repositories/record-repository"

export class Domain implements IDomain {
  domain: IDomain
  contractRepository: IContractRepository

  constructor(domain: IDomain, contractRepository: IContractRepository) {
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
