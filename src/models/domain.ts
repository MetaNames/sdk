import { IDomain, IMetaNamesContractRepository } from "../interface"
import { RecordRepository } from "../repositories"

/**
 * Domain model that wraps the IDomain interface
 */
export class Domain implements IDomain {
  name: string
  tld: string
  owner: string
  tokenId: number
  parentId?: string
  records: Map<string, string | Buffer>

  private contractRepository: IMetaNamesContractRepository

  constructor(domain: IDomain, contractRepository: IMetaNamesContractRepository) {
    this.contractRepository = contractRepository

    this.tld = domain.tld
    this.name = [this.normalizedName(domain.name), this.tld].join('.')
    this.owner = domain.owner
    this.tokenId = domain.tokenId
    this.parentId = domain.parentId ? [this.normalizedName(domain.parentId), this.tld].join('.') : undefined
    this.records = domain.records
  }

  get nameWithoutTLD() {
    return this.name.split('.').slice(0, -1).join('.')
  }

  private normalizedName(name: string) {
    return name.split('.').reverse().join('.')
  }

  get recordRepository(): RecordRepository {
    return new RecordRepository(this.contractRepository, this)
  }
}
