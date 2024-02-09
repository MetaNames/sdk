import { IDomain } from "../interface"
import { MetaNamesSdk } from "../meta-names-sdk"
import { RecordRepository } from "../repositories"
import { DomainValidator } from "../validators"

/**
 * Domain model that wraps the IDomain interface
 */
export class Domain implements IDomain {
  name: string
  tld: string
  createdAt: Date
  expiresAt?: Date
  owner: string
  tokenId: number
  parentId?: string
  records: Map<string, string | Buffer>

  constructor(domain: IDomain) {
    // Do not save the validator in the instance to keep the memory usage low
    const domainValidator = new DomainValidator(domain.tld)

    const normalizationOptions = { reverse: true }
    this.tld = domain.tld
    this.name = [domainValidator.normalize(domain.name, normalizationOptions), this.tld].join('.')
    this.createdAt = domain.createdAt
    this.expiresAt = domain.expiresAt
    this.owner = domain.owner
    this.tokenId = domain.tokenId
    this.parentId = domain.parentId ? [domainValidator.normalize(domain.parentId, normalizationOptions), this.tld].join('.') : undefined
    this.records = domain.records
  }

  get nameWithoutTLD() {
    return this.name.split('.').slice(0, -1).join('.')
  }

  /**
   * Normalize the name by reversing the domain name, apply the toUnicode
   * and by default remove the TLD
   * @param options: { removeTLD: true }
   * @returns Normalized domain name
   */
  normalizedName({ removeTLD } = { removeTLD: true }) {
    const domainValidator = new DomainValidator(this.tld)
    return domainValidator.normalize(this.name, { removeTLD, reverse: true })
  }

  /**
   * Syntax sugar method to get the record repository
   * @param sdk MetaNamesSdk
   * @returns RecordRepository
   */
  getRecordRepository(sdk: MetaNamesSdk): RecordRepository {
    const contract = sdk.contract
    return new RecordRepository(contract, this)
  }
}
