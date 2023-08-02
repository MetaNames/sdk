import { AbiParser, StateReader } from '@partisiablockchain/abi-client-ts'
import { PartisiaAccount } from 'partisia-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-rpc/lib/main/accountInfo'
import { createTransaction } from '../actions'
import { Contract, ContractParams, IContractRepository, ITransactionResult, TransactionParams } from '../interface'


type ContractRegistry = {
  [address: string]: Contract
}

/**
 * Contract repository to interact with smart contracts on Partisia
 */
export class ContractRepository implements IContractRepository {
  rpc: PartisiaAccountClass
  contractRegistry: ContractRegistry
  privateKey?: string


  constructor(rpc: IPartisiaRpcConfig) {
    this.contractRegistry = {}
    this.rpc = PartisiaAccount(rpc)
  }

  setPrivateKey(privateKey?: string) {
    this.privateKey = privateKey
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
    if (!this.privateKey) throw new Error('Private key not found')
    if (!contractAddress) throw new Error('Contract address not found')

    return await createTransaction(this.rpc, contractAddress, this.privateKey, payload)
  }

  private async getContractFromRegistry({ contractAddress, force, withState }: ContractParams): Promise<Contract | undefined> {
    let contract = this.contractRegistry[contractAddress]
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

    this.contractRegistry[contractAddress] = contract

    return contract
  }
}
