import { AbiParser, ScValueStruct, StateReader } from '@partisiablockchain/abi-client-ts'
import { PartisiaAccount } from 'partisia-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-rpc/lib/main/accountInfo'
import { RecordClassEnum } from './interface'
import { getPnsRecords, lookUpRecord } from './partisia-name-system'

export class MetaNamesContract {
  abi?: string
  contractAddress: string
  rpc: PartisiaAccountClass
  contract: any

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig, abi?: string) {
    this.abi = abi
    this.contractAddress = contractAddress
    this.rpc = PartisiaAccount(rpc)
  }

  async getContract(force = true) {
    if (force || !this.contract) {
      this.contract = await this.rpc.getContract(
        this.contractAddress,
        this.rpc.deriveShardId(this.contractAddress),
        true
      )
      this.abi = this.contract.data.abi
    }

    return this.contract
  }

  async getMetaNamesStruct(): Promise<ScValueStruct> {
    const contract = await this.getContract()

    // deserialize state
    const fileAbi = new AbiParser(Buffer.from(this.abi!, 'base64')).parseAbi()
    const reader = new StateReader(
      Buffer.from(contract.data.serializedContract!.state.data, 'base64'),
      fileAbi.contract
    )
    const struct = reader.readStruct(fileAbi.contract.getStateStruct())

    return struct
  }

  async recordLookup(recordClass: RecordClassEnum, domain: string): Promise<string> {
    const struct = await this.getMetaNamesStruct()
    const records = getPnsRecords(struct)

    const qualifiedName = this.getQualifiedName(domain, recordClass)
    const record = lookUpRecord(records, qualifiedName)
    if (!record) throw new Error('Record not found')

    return record
  }

  getQualifiedName(domain: string, recordClass: RecordClassEnum) {
    switch (recordClass) {
      case RecordClassEnum.Wallet:
        return `wallet.${domain}`
      case RecordClassEnum.Uri:
        return `uri.${domain}`
      case RecordClassEnum.Twitter:
        return `twitter.${domain}`
    }
  }
}
