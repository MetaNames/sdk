import { AbiParser, FileAbi, StateReader } from '@partisiablockchain/abi-client'
import { PartisiaAccount } from 'partisia-blockchain-applications-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'
import { createTransactionFromMetaMaskClient, createTransactionFromPartisiaClient, createTransactionFromPrivateKey } from '../actions'
import { ByocCoin, Contract, ContractData, ContractEntry, ContractParams, GasCost, IContractRepository, ITransactionIntent, TransactionParams } from '../interface'
import { Enviroment } from '../providers'
import { SecretsProvider } from '../providers/secrets'
import { convertAvlTree, promiseRetry } from './helpers/contract'
import { AvlClient } from './helpers/avl-client'


/**
 * Contract repository to interact with smart contracts on Partisia
 */
export class ContractRepository implements IContractRepository {
  private rpc: PartisiaAccountClass
  private contractRegistry: Map<string, ContractEntry>
  protected avlClient: AvlClient

  constructor(rpc: IPartisiaRpcConfig, private environment: Enviroment, private secrets: SecretsProvider, private ttl: number) {
    this.contractRegistry = new Map()
    this.rpc = PartisiaAccount(rpc)
    this.avlClient = new AvlClient(rpc.urlBaseGlobal.url, rpc.urlBaseShards.map((shard) => shard.shard_id))
  }

  /**
   * Get a smart contract
   */
  async getContract(params: ContractParams) {
    const contract = await this.getContractFromRegistry(params)
    if (!contract) throw new Error('Contract not found')

    return contract
  }

  /**
   * Get the contract state
   */
  async getState(params: ContractParams) {
    const contract = await this.getContract({ ...params, withState: true })

    const serializedContract = contract.data.serializedContract
    if (!serializedContract) throw new Error('Contract state not found')
    if (!('state' in serializedContract)) throw new Error('Contract state not found')

    const contractAbi = contract.abi
    const reader = new StateReader(Buffer.from(serializedContract.state.data, 'base64'), contractAbi, serializedContract.avlTree)
    const struct = reader.readStruct(contractAbi.getStateStruct())

    return struct
  }

  async getAbi(contractAddress?: string): Promise<FileAbi> {
    if(!contractAddress) throw new Error('Contract address not found')

    const contract = await this.getContract({ contractAddress, partial: true })
    if (!contract) throw new Error('Contract not found')

    return this.parseAbi(contract.data.abi)
  }

  /**
   * Get Byoc coins
   * @returns ByocCoin[]
   */
  async getByocCoins(): Promise<ByocCoin[]> {
    const coins = await promiseRetry(() => this.rpc.fetchCoins())

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
      'low': 8000,
      'medium': 40000,
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

  private async getContractFromRegistry({ contractAddress, force, withState, partial }: ContractParams): Promise<Contract | undefined> {
    let contractEntry = this.contractRegistry.get(contractAddress)

    const serializedContract = contractEntry?.contract.data.serializedContract
    const hasPartialState = serializedContract?.state !== undefined
    const hasFullState = hasPartialState && serializedContract?.avlTree !== undefined

    if (contractEntry && !force &&
      ((partial && hasPartialState) ||
        (withState && hasFullState) ||
        !withState) &&
      ((Date.now() - contractEntry.fetchedAt) < this.ttl))
      return contractEntry.contract

    const rawContract = await this.fetchContract(contractAddress, { partial, withState })
    if (!rawContract) return

    const fileAbi = this.parseAbi(rawContract.abi)
    contractEntry = {
      fetchedAt: Date.now(),
      contract: {
        data: rawContract,
        abi: fileAbi.contract
      }
    }

    this.contractRegistry.set(contractAddress, contractEntry)

    return contractEntry.contract
  }

  private parseAbi(abi: string) {
    return new AbiParser(Buffer.from(abi, 'base64')).parseAbi()
  }

  private async fetchContract(contractAddress: string, options: { partial?: boolean, withState?: boolean } = {}): Promise<ContractData | undefined> {
    const normalizedOptions = {
      withState: false,
      partial: false,
      ...options,
    }

    let contract
    if (!normalizedOptions.partial)
      contract = await promiseRetry(async () => {
        const contract = await this.rpc.getContract(contractAddress, this.rpc.deriveShardId(contractAddress), normalizedOptions.withState)
        if (!contract) return

        const serializedContract = contract.data.serializedContract

        let avlTree
        if (serializedContract?.avlTrees)
          avlTree = convertAvlTree(serializedContract.avlTrees)

        return {
          abi: contract.data.abi,
          serializedContract: {
            state: serializedContract?.state,
            avlTree,
          }
        }
      })
    else
      contract = await promiseRetry(() => this.avlClient.getBinaryContractState(contractAddress))

    return contract
  }
}
