import { AbiParser, StateReader } from '@partisiablockchain/abi-client-ts'
import { PartisiaAccount } from 'partisia-blockchain-applications-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'
import { createTransactionFromClient, createTransactionFromPrivateKey } from '../actions'
import { Contract, ContractParams, IContractRepository, ITransactionResult, TransactionParams } from '../interface'
import PartisiaSdk from 'partisia-sdk'
import { create } from 'domain'


/**
 * Contract repository to interact with smart contracts on Partisia
 */
export class ContractRepository implements IContractRepository {
  private rpc: PartisiaAccountClass
  private contractRegistry: Map<string, Contract>
  private privateKey?: string
  private partisiaSdk?: PartisiaSdk

  constructor(rpc: IPartisiaRpcConfig) {
    this.contractRegistry = new Map()
    this.rpc = PartisiaAccount(rpc)
  }

  setPrivateKey(privateKey?: string) {
    this.privateKey = privateKey
  }

  setPartisiaSdk(partisiaSdk?: PartisiaSdk) {
    this.partisiaSdk = partisiaSdk
  }

  /**
   * Get a smart contract
   * @param force Force to get the contract
   */
  async getContract(params: ContractParams) {
    const contract = await this.getContractFromRegistry(params)
    if (!contract) throw new Error('Contract not found')

    return contract
  }

  async getState(params: ContractParams) {
    const contract = await this.getContract(params)

    const serializedContract = contract.data.serializedContract
    if (!serializedContract) throw new Error('Contract state not found')
    if (!('state' in serializedContract)) throw new Error('Contract state not found')

    const contractAbi = contract.abi
    const reader = new StateReader(Buffer.from(serializedContract.state.data, 'base64'), contractAbi)
    const struct = reader.readStruct(contractAbi.getStateStruct())

    return struct
  }


  /**
   * Create a transaction
   * @param payload Transaction payload
   */
  async createTransaction({ contractAddress, payload }: TransactionParams): Promise<ITransactionResult> {
    if (!contractAddress) throw new Error('Contract address not found')

    if (this.privateKey)
      return createTransactionFromPrivateKey(this.rpc, contractAddress, this.privateKey, payload)
    else if (this.partisiaSdk)
      return createTransactionFromClient(this.rpc, this.partisiaSdk, contractAddress, payload)
    else
      throw new Error('Private key and Partisia SDK not found')
  }

  private async getContractFromRegistry({ contractAddress, force, withState }: ContractParams): Promise<Contract | undefined> {
    let contract = this.contractRegistry.get(contractAddress)
    // Return contract if it was found and:
    // the retrival wasn't forced
    // or if the state is requested, then require the state to be present
    if (contract && !force &&
      ((withState && contract.data.serializedContract) || !withState))
      return contract


    const rawContract = await this.rpc.getContract(
      contractAddress,
      this.rpc.deriveShardId(contractAddress),
      withState
    )
    if (!rawContract) return

    const fileAbi = new AbiParser(Buffer.from(rawContract.data.abi, 'base64')).parseAbi()
    contract = {
      abi: fileAbi.contract,
      ...rawContract
    }

    this.contractRegistry.set(contractAddress, contract)

    return contract
  }
}
