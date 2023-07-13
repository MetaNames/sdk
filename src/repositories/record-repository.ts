import { actionRecordDeletePayload, actionRecordMintPayload, actionRecordUpdatePayload } from "../actions"
import { IActionRecordDelete, IActionRecordMint, IActionRecordUpdate, IContractRepository, IDomain, RecordClassEnum } from "../interface"
import { lookUpRecord } from "../partisia-name-system"

export class RecordRepository {
    contractRepository: IContractRepository
    domain: IDomain

    constructor(contractRepository: IContractRepository, domain: IDomain) {
        this.contractRepository = contractRepository
        this.domain = domain
    }

    async mint(params: IActionRecordMint) {
        const contractAbi = await this.contractRepository.getContractAbi()
        const payload = actionRecordMintPayload(contractAbi, params)

        return await this.contractRepository.createTransaction(payload)
    }

    async find(recordClass: RecordClassEnum) {
      const data = lookUpRecord(this.domain, recordClass)
      if (!data) throw new Error('Record not found')

      return data
    }

  async update(params: IActionRecordUpdate) {
    const contractAbi = await this.contractRepository.getContractAbi()
    const payload = actionRecordUpdatePayload(contractAbi, params)

    return await this.contractRepository.createTransaction(payload)
  }

  async delete(params: IActionRecordDelete) {
    const contractAbi = await this.contractRepository.getContractAbi()
    const payload = actionRecordDeletePayload(contractAbi, params)

    return await this.contractRepository.createTransaction(payload)
  }
}
