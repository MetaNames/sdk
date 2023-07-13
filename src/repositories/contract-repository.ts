import { AbiParser, ContractAbi, FileAbi, StateReader } from '@partisiablockchain/abi-client-ts'
import { PartisiaAccount } from 'partisia-rpc'
import { IContractInfo, IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-rpc/lib/main/accountInfo'
import { IContractZk } from 'partisia-rpc/lib/main/interface-zk'
import { createTransaction } from '../actions'
import { IContractRepository, ITransactionResult, MetaNamesState } from '../interface'

export class ContractRepository implements IContractRepository {
  abi?: string
  contractAddress: string
  rpc: PartisiaAccountClass
  contract?: { shard_id: number; data: IContractInfo | IContractZk }
  privateKey?: string

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig) {
    this.contractAddress = contractAddress
    this.rpc = PartisiaAccount(rpc)
  }

  setPrivateKey(privateKey?: string) {
    this.privateKey = privateKey
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

  async getContractAbi(): Promise<ContractAbi> {
    if (!this.contract) {
      const contract = await this.getContract()
      this.abi = contract.data.abi
    }
    if (!this.abi) throw new Error('Abi not found')

    const fileAbi =  new AbiParser(Buffer.from(this.abi, 'base64')).parseAbi()

    return fileAbi.contract
  }

  async getState(): Promise<MetaNamesState> {
    const contract = await this.getContract(true)

    const contractAbi = await this.getContractAbi()
    const serializedContract = contract.data.serializedContract
    if (!serializedContract) throw new Error('Contract state not found')
    if (!('state' in serializedContract)) throw new Error('Contract state not found')

    const reader = new StateReader(Buffer.from(serializedContract.state.data, 'base64'), contractAbi)
    const struct = reader.readStruct(contractAbi.getStateStruct())

    return struct
  }

  async createTransaction(payload: Buffer): Promise<ITransactionResult> {
    if (!this.privateKey) throw new Error('Private key not found')

    return await createTransaction(this.rpc, this.contractAddress, this.privateKey, payload)
  }
}
