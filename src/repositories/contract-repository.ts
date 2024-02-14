import { AbiParser, StateReader } from '@partisiablockchain/abi-client'
import { PartisiaAccount } from 'partisia-blockchain-applications-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'
import { createTransactionFromMetaMaskClient, createTransactionFromPartisiaClient, createTransactionFromPrivateKey } from '../actions'
import { ByocCoin, Contract, ContractEntry, ContractParams, GasCost, IContractRepository, ITransactionIntent, TransactionParams } from '../interface'
import { Enviroment } from '../providers'
import { SecretsProvider } from '../providers/secrets'
import { convertAvlTree } from './helpers/contract'


/**
 * Contract repository to interact with smart contracts on Partisia
 */
export class ContractRepository implements IContractRepository {
  private rpc: PartisiaAccountClass
  private contractRegistry: Map<string, ContractEntry>

  constructor(rpc: IPartisiaRpcConfig, private environment: Enviroment, private secrets: SecretsProvider, private ttl: number) {
    this.contractRegistry = new Map()
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
    const contract = await this.getContract({ ...params, withState: true })

    const serializedContract = contract.data.serializedContract
    if (!serializedContract) throw new Error('Contract state not found')
    if (!('state' in serializedContract)) throw new Error('Contract state not found')

    const contractAbi = contract.abi
    const reader = new StateReader(Buffer.from(serializedContract.state.data, 'base64'), contractAbi, contract.avlTree)
    const struct = reader.readStruct(contractAbi.getStateStruct())

    return struct
  }

  /**
   * Get Byoc coins
   * @returns ByocCoin[]
   */
  async getByocCoins(): Promise<ByocCoin[]> {
    const coins = await this.rpc.fetchCoins()

    const byocCoins: ByocCoin[] = coins.coins.map((coin) => {
      return {
        conversionRate: {
          unit_value: Number(coin.conversionRate.numerator),
          scale_factor: Number(coin.conversionRate.denominator),
        },
        symbol: coin.symbol,
      }
    })

    return byocCoins
  }


  /**
   * Create a transaction
   * @param payload Transaction payload
   */
  async createTransaction({ contractAddress, payload, gasCost }: TransactionParams): Promise<ITransactionIntent> {
    if (!contractAddress) throw new Error('Contract address not found')

    const isMainnet = this.environment === Enviroment.mainnet
    const gasTable: Record<GasCost, number> = {
      'low': 5000,
      'high': 50000,
    }

    const gas = gasCost ? gasTable[gasCost] : gasTable.low

    // Remove contract cache as the state will change
    this.cleanCache(contractAddress)

    switch (this.secrets.strategy) {
      case 'privateKey':
        return createTransactionFromPrivateKey(this.rpc, contractAddress, this.secrets.privateKey, payload, isMainnet, gas)

      case 'partisiaSdk':
        return createTransactionFromPartisiaClient(this.rpc, this.secrets.partisiaSdk, contractAddress, payload, gas)

      case 'MetaMask':
        return createTransactionFromMetaMaskClient(this.rpc, this.secrets.metaMask, contractAddress, payload, isMainnet, gas)

      default:
        throw new Error('Signing strategy not found')
    }
  }

  private cleanCache(contractAddress: string) {
    this.contractRegistry.delete(contractAddress)
  }

  private async getContractFromRegistry({ contractAddress, force, withState }: ContractParams): Promise<Contract | undefined> {
    let contractEntry = this.contractRegistry.get(contractAddress)
    if (contractEntry && !force &&
      ((withState && contractEntry.contract.data.serializedContract) || !withState) &&
      ((Date.now() - contractEntry.fetchedAt) < this.ttl))
      return contractEntry.contract

    const rawContract = await this.rpc.getContract(
      contractAddress,
      this.rpc.deriveShardId(contractAddress),
      withState
    )
    if (!rawContract) return

    const fileAbi = new AbiParser(Buffer.from(rawContract.data.abi, 'base64')).parseAbi()
    contractEntry = {
      fetchedAt: Date.now(),
      contract: {
        abi: fileAbi.contract,
        ...rawContract
      }
    }

    if (rawContract.data.serializedContract) {
      const avlTrees = rawContract.data.serializedContract.avlTrees
      if (avlTrees) {
        const avlTree = convertAvlTree(avlTrees)
        contractEntry.contract.avlTree = avlTree
      }
    }

    this.contractRegistry.set(contractAddress, contractEntry)

    return contractEntry.contract
  }
}
