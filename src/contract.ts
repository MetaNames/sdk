import { AbiParser, FileAbi, ScValueStruct, StateReader } from '@partisiablockchain/abi-client-ts'
import { PartisiaAccount } from 'partisia-rpc'
import { IContractInfo, IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-rpc/lib/main/accountInfo'
import { IActionDomainMint, IActionRecordDelete, IActionRecordMint, IActionRecordUpdate, IDomain, RecordClassEnum } from './interface'
import { getPnsDomains, lookUpDomain, lookUpRecord } from './partisia-name-system'
import { IContractZk } from 'partisia-rpc/lib/main/interface-zk'
import { actionDomainMintPayload, actionRecordDeletePayload, actionRecordMintPayload, actionRecordUpdatePayload, createTransaction } from './actions'

export class MetaNamesContract {
  abi?: string
  contractAddress: string
  rpc: PartisiaAccountClass
  contract?: { shard_id: number; data: IContractInfo | IContractZk }
  isMainnet: boolean

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig, isMainnet?: boolean, abi?: string) {
    this.abi = abi
    this.contractAddress = contractAddress
    this.isMainnet = isMainnet ?? false
    this.rpc = PartisiaAccount(rpc)
  }

  async getContract(force = false) {
    if (force || !this.contract) {
      const contract = await this.rpc.getContract(
        this.contractAddress,
        this.rpc.deriveShardId(this.contractAddress),
        true
      )
      if (!contract) throw new Error('Contract not found')

      this.contract = contract
      this.abi = this.contract.data.abi
    }

    return this.contract
  }

  async getFileAbi(): Promise<FileAbi> {
    if (!this.contract) {
      const contract = await this.getContract()
      this.abi = contract.data.abi
    }
    if (!this.abi) throw new Error('Abi not found')

    return new AbiParser(Buffer.from(this.abi, 'base64')).parseAbi()
  }

  async getMetaNamesStruct(): Promise<ScValueStruct> {
    const contract = await this.getContract(true)

    // deserialize state
    const fileAbi = await this.getFileAbi()
    const serializedContract = contract.data.serializedContract
    if (!serializedContract) throw new Error('Contract state not found')
    if (!('state' in serializedContract)) throw new Error('Contract state not found')

    const reader = new StateReader(Buffer.from(serializedContract.state.data, 'base64'), fileAbi.contract)
    const struct = reader.readStruct(fileAbi.contract.getStateStruct())

    return struct
  }

  async domainLookup(domainName: string): Promise<IDomain> {
    const struct = await this.getMetaNamesStruct()
    const domains = getPnsDomains(struct)

    const domain = lookUpDomain(domains, domainName)
    if (!domain) throw new Error('Domain not found')

    return domain
  }

  async recordLookup(recordClass: RecordClassEnum, domainName: string): Promise<string | Buffer> {
    const domain = await this.domainLookup(domainName)

    const record = lookUpRecord(domain, recordClass)
    if (!record) throw new Error('Record not found')

    return record
  }

  async domainMint(privateKey: string, params: IActionDomainMint) {
    const fileAbi = await this.getFileAbi()
    const payload = actionDomainMintPayload(fileAbi.contract, params)

    return await createTransaction(this.rpc, this.contractAddress, privateKey, payload)
  }

  async recordMint(privateKey: string, params: IActionRecordMint) {
    const fileAbi = await this.getFileAbi()
    const payload = actionRecordMintPayload(fileAbi.contract, params)

    return await createTransaction(this.rpc, this.contractAddress, privateKey, payload)
  }

  async recordUpdate(privateKey: string, params: IActionRecordUpdate) {
    const fileAbi = await this.getFileAbi()
    const payload = actionRecordUpdatePayload(fileAbi.contract, params)

    return await createTransaction(this.rpc, this.contractAddress, privateKey, payload)
  }

  async recordDelete(privateKey: string, params: IActionRecordDelete) {
    const fileAbi = await this.getFileAbi()
    const payload = actionRecordDeletePayload(fileAbi.contract, params)

    return await createTransaction(this.rpc, this.contractAddress, privateKey, payload)
  }
}
