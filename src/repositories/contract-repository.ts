import { AbiParser, StateReader } from '@partisiablockchain/abi-client-ts'
import { PartisiaAccount } from 'partisia-blockchain-applications-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'
import { createTransactionFromPartisiaClient, createTransactionFromPrivateKey, createTransactionFromMetaMaskClient } from '../actions'
import { Contract, ContractParams, GasCost, IContractRepository, ITransactionResult, TransactionParams } from '../interface'
import { SecretsProvider } from '../providers/secrets'
import { Enviroment } from '../providers'


/**
 * Contract repository to interact with smart contracts on Partisia
 */
export class ContractRepository implements IContractRepository {
  private rpc: PartisiaAccountClass
  private contractRegistry: Map<string, Contract>
  private environment: Enviroment

  constructor(rpc: IPartisiaRpcConfig, environment: Enviroment) {
    this.contractRegistry = new Map()
    this.environment = environment
    this.rpc = PartisiaAccount(rpc)
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
  async createTransaction({ contractAddress, payload, gasCost }: TransactionParams): Promise<ITransactionResult> {
    if (!contractAddress) throw new Error('Contract address not found')

    const isMainnet = this.environment === Enviroment.mainnet
    const gasTable: Record<GasCost, number> = {
      'low': 4490,
      'high': 32490,
    }

    const gas = gasCost ? gasTable[gasCost] : gasTable.low

    const manager = SecretsProvider.getInstance()
    switch (manager.strategy) {
      case 'privateKey':
        return createTransactionFromPrivateKey(this.rpc, contractAddress, manager.privateKey, payload, isMainnet, gas)

      case 'partisiaSdk':
        return createTransactionFromPartisiaClient(this.rpc, manager.partisiaSdk, contractAddress, payload, gas)

      case 'MetaMask':
        return createTransactionFromMetaMaskClient(this.rpc, manager.metaMask, contractAddress, payload, isMainnet, gas)

      default:
        throw new Error('Signing strategy not found')
    }
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
