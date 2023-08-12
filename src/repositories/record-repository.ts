import { actionRecordDeletePayload, actionRecordMintPayload, actionRecordUpdatePayload } from "../actions"
import { IMetaNamesContractRepository, IDomain, IRecord, RecordClassEnum } from "../interface"
import { lookUpRecord } from "../partisia-name-system"
import RecordValidator from "../validators/record-validator"

/**
 * Repository to interact with records of a domain on the Meta Names contract
 */
export class RecordRepository {
  private contractRepository: IMetaNamesContractRepository
  private domain: IDomain
  public recordValidator: RecordValidator

  constructor(contractRepository: IMetaNamesContractRepository, domain: IDomain) {
    this.contractRepository = contractRepository
    this.domain = domain
    this.recordValidator = new RecordValidator()
  }

  /**
   * Mint a record for a domain
   * @param params Record params
   */
  async mint(params: IRecord) {
    if (!this.recordValidator.validate(params)) throw new Error('Record validation failed')

    const contract = await this.contractRepository.getContract()
    const payload = actionRecordMintPayload(contract.abi, this.addDomainToParams(params))

    return this.contractRepository.createTransaction({ payload })
  }

  /**
   * Finds a record by class
   * @param recordClass Record class
   */
  async find(recordClass: RecordClassEnum) {
    const data = lookUpRecord(this.domain, recordClass)
    if (!data) return null

    return data
  }

  /**
   * Update a record for a domain
   * @param params Record params
   */
  async update(params: IRecord) {
    if (!this.recordValidator.validate(params)) throw new Error('Record validation failed')

    const contract = await this.contractRepository.getContract()
    const payload = actionRecordUpdatePayload(contract.abi, this.addDomainToParams(params))

    return this.contractRepository.createTransaction({ payload })
  }

  /**
   * Delete a record for a domain
   * @param recordClass Record class
   */
  async delete(recordClass: RecordClassEnum) {
    const contract = await this.contractRepository.getContract()
    const payload = actionRecordDeletePayload(contract.abi, this.addDomainToParams({ class: recordClass }))

    return this.contractRepository.createTransaction({ payload })
  }

  private addDomainToParams<T>(params: T) {
    return {
      domain: this.domain.name,
      ...params
    }
  }
}
