import { IContractRepository } from "../interface"
import { RecordRepository } from "../repositories/record-repository"

export class Domain {
  tokenId: number
  parentId?: string
  records: Map<string, string | Buffer>

  constructor(tokenId: number, parentId?: string, records?: Map<string, string | Buffer>) {
    this.tokenId = tokenId
    this.parentId = parentId
    this.records = records || new Map()
  }

  getRecordRepository(contractRepository: IContractRepository): RecordRepository {
    return new RecordRepository(contractRepository, this)
  }
}
