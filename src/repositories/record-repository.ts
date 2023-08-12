import { actionRecordDeletePayload, actionRecordMintPayload, actionRecordUpdatePayload } from "../actions"
import { IMetaNamesContractRepository, IDomain, IRecord, RecordClassEnum, IValidatorInterface, IValidatorOptions } from "../interface"
import { lookUpRecord } from "../partisia-name-system"
import RecordValidator from "../validators/record-validator"

/**
 * Repository to interact with records of a domain on the Meta Names contract
 */
export class RecordRepository {
  contractRepository: IMetaNamesContractRepository
  domain: IDomain
  recordValidator: RecordValidator

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

  /**
   * Normalize record
   * @param record Record
   * @param options Normalization options
   * @returns Normalized record
   */
  normalize(record: IRecord, options?: IValidatorOptions) {
    this.recordValidator.normalize(record, options)
  }

  /**
   *  Validate record
   * @param record Record
   * @param options Validation options
   * @returns True if the domain is valid
   */
  validate(record: IRecord, options?: IValidatorOptions) {
    this.recordValidator.validate(record, options)
  }

  /**
   * Get validator errors
   * @returns Validator errors
   */
  get validatorErrors() {
    return this.recordValidator.errors
  }


  private addDomainToParams<T>(params: T) {
    return {
      domain: this.domain.name,
      ...params
    }
  }
}
