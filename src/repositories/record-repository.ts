import { actionRecordDeletePayload, actionRecordMintBatchPayload, actionRecordMintPayload, actionRecordUpdatePayload } from "../actions"
import { IDomain, IMetaNamesContractRepository, IRecord, RecordClassEnum } from "../interface"
import { Domain } from "../models"
import { lookUpRecord } from "../partisia-name-system"
import { getRecordValidator } from "../validators"

/**
 * Repository to interact with records of a domain on the Meta Names contract
 */
export class RecordRepository {
  private contractRepository: IMetaNamesContractRepository
  private domain: Domain

  constructor(contractRepository: IMetaNamesContractRepository, domain: IDomain) {
    this.contractRepository = contractRepository
    this.domain = new Domain(domain)
  }

  /**
   * Create a record for the given domain
   * @param params Record params
   */
  async create(params: IRecord) {
    if (!this.getValidator(params).validate(params)) throw new Error('Record validation failed')

    const contract = await this.contractRepository.getContract()
    const payload = actionRecordMintPayload(contract.abi, this.addDomainToParams(params))

    return this.contractRepository.createTransaction({ payload })
  }

  async createBatch(params: IRecord[]) {
    const normalizedParams = params.map((p) => {
      if (!this.getValidator(p).validate(p)) throw new Error('Record validation failed')

      return this.addDomainToParams(p)
    })
    const contract = await this.contractRepository.getContract()
    const payload = actionRecordMintBatchPayload(contract.abi, normalizedParams)

    return this.contractRepository.createTransaction({ payload })
  }

  /**
   * Find a record given the class
   * @param recordClass Record class
   */
  async find(recordClass: RecordClassEnum) {
    const data = lookUpRecord(this.domain, recordClass)
    if (!data) return null

    return data
  }

  /**
   * Update a record for the given domain
   * @param params Record params
   */
  async update(params: IRecord) {
    if (!this.getValidator(params).validate(params)) throw new Error('Record validation failed')

    const contract = await this.contractRepository.getContract()
    const payload = actionRecordUpdatePayload(contract.abi, this.addDomainToParams(params))

    return this.contractRepository.createTransaction({ payload })
  }

  /**
   * Delete a record for the given domain
   * @param recordClass Record class
   */
  async delete(recordClass: RecordClassEnum) {
    const contract = await this.contractRepository.getContract()
    const payload = actionRecordDeletePayload(contract.abi, this.addDomainToParams({ class: recordClass }))

    return this.contractRepository.createTransaction({ payload })
  }

  private addDomainToParams<T>(params: T) {
    return {
      domain: this.domain.nameWithoutTLD,
      ...params
    }
  }

  private getValidator(record: IRecord) {
    return getRecordValidator(record.class)
  }
}
