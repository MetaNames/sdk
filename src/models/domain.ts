import { IDomain, IMetaNamesContractRepository } from "../interface"
import { RecordRepository } from "../repositories"
import { DomainValidator } from "../validators"

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
  private domainValidator: DomainValidator

  constructor(domain: IDomain, contractRepository: IMetaNamesContractRepository) {
    this.contractRepository = contractRepository
    this.domainValidator = new DomainValidator(domain.tld)

    this.tld = domain.tld
    this.name = [this.domainValidator.normalize(domain.name), this.tld].join('.')
    this.owner = domain.owner
    this.tokenId = domain.tokenId
    this.parentId = domain.parentId ? [this.domainValidator.normalize(domain.parentId), this.tld].join('.') : undefined
    this.records = domain.records
  }

  get nameWithoutTLD() {
    return this.name.split('.').slice(0, -1).join('.')
  }

  get recordRepository(): RecordRepository {
    return new RecordRepository(this.contractRepository, this)
  }
}
