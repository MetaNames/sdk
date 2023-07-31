import { actionRecordDeletePayload, actionRecordMintPayload, actionRecordUpdatePayload } from "../actions"
import { IContractRepository, IDomain, IRecord, RecordClassEnum } from "../interface"
import { lookUpRecord } from "../partisia-name-system"

export class RecordRepository {
  contractRepository: IContractRepository
  domain: IDomain

  constructor(contractRepository: IContractRepository, domain: IDomain) {
    this.contractRepository = contractRepository
    this.domain = domain
  }

  async mint(params: IRecord) {
    const contractAbi = await this.contractRepository.getContractAbi()
    const payload = actionRecordMintPayload(contractAbi, this.addDomainToParams(params))

    return await this.contractRepository.createTransaction(payload)
  }

  async find(recordClass: RecordClassEnum) {
    const data = lookUpRecord(this.domain, recordClass)
    if (!data) throw new Error('Record not found')

    return data
  }

  async update(params: IRecord) {
    const contractAbi = await this.contractRepository.getContractAbi()
    const payload = actionRecordUpdatePayload(contractAbi, this.addDomainToParams(params))

    return await this.contractRepository.createTransaction(payload)
  }

  async delete(recordClass: RecordClassEnum) {
    const contractAbi = await this.contractRepository.getContractAbi()
    const payload = actionRecordDeletePayload(contractAbi, this.addDomainToParams({ class: recordClass }))

    return await this.contractRepository.createTransaction(payload)
  }

  private addDomainToParams<T>(params: T) {
    return {
      domain: this.domain.name,
      ...params
    }
  }
}
