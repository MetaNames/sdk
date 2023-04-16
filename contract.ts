import { AbiParser, JsonValueConverter, StateReader } from 'abi-client-ts'
import { PartisiaAccount } from 'partisia-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-rpc/lib/main/accountInfo'
import { IMetaNamesState, IRecord, RecordClassEnum } from './interface'

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

  async getContract() {
    if (!this.contract) {
      this.contract = await this.rpc.getContract(
        this.contractAddress,
        this.rpc.deriveShardId(this.contractAddress),
        true
      )
    }

    return this.contract
  }

  async initAbi() {
    const contract = await this.getContract()
    if (!contract) throw new Error('Contract not found')

    this.abi = contract.data.abi
  }

  async getMetaNamesState(): Promise<IMetaNamesState> {
    if (!this.abi) await this.initAbi()
    const contract = await this.getContract()

    // deserialize state
    const fileAbi = new AbiParser(Buffer.from(this.abi!, 'base64')).parseAbi()
    const reader = new StateReader(
      Buffer.from(contract.data.serializedContract!.state.data, 'base64'),
      fileAbi.contract
    )
    const struct = reader.readStruct(fileAbi.contract.getStateStruct())
    return JsonValueConverter.toJson(struct) as any
  }

  async lookUpRecord(domain: string, recordClass: RecordClassEnum): Promise<string> {
    const state = await this.getMetaNamesState()
    // console.log(state.pns.records)

    const qualifiedName = this.getQualifiedName(domain, recordClass)
    const record = state.pns.records.find((record) => record.key === qualifiedName)?.value
    if (!record) throw new Error('Record not found')

    return record.data
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
