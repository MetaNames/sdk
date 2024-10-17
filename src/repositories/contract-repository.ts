import { AbiParser, ContractAbi, FileAbi, StateReader } from '@partisiablockchain/abi-client'
import { PartisiaAccount } from 'partisia-blockchain-applications-rpc'
import { IPartisiaRpcConfig, PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'
import { ByocCoin, Contract, ContractData, ContractEntry, ContractParams, GasCost, IContractRepository, ITransactionIntent, RawContractData, TransactionParams } from '../interface'
import { Enviroment } from '../providers'
import { SecretsProvider } from '../providers/secrets'
import { convertAvlTree as convertAvlTrees } from './helpers/contract'
import { AvlClient } from './helpers/avl-client'
import { getRequest, promiseRetry } from './helpers/client'
import { createTransactionFromLedgerClient, createTransactionFromMetaMaskClient, createTransactionFromPartisiaClient, createTransactionFromPrivateKey } from '../transactions'


/**
 * Contract repository to interact with smart contracts on Partisia
 */
export class ContractRepository implements IContractRepository {
  private rpc: PartisiaAccountClass
  private contractRegistry: Map<string, ContractEntry>
  private hostUrl: string
  protected avlClient: AvlClient

  constructor(rpc: IPartisiaRpcConfig, private environment: Enviroment, private secrets: SecretsProvider, private ttl: number, protected hasProxyContract: boolean) {
    this.contractRegistry = new Map()
    this.rpc = PartisiaAccount(rpc)
    this.hostUrl = rpc.urlBaseGlobal.url
    this.avlClient = new AvlClient(this.hostUrl, rpc.urlBaseShards.map((shard) => shard.shard_id))
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

    const serializedContract = contract?.data?.serializedContract
    if (!serializedContract) throw new Error('Contract state not found')
    if (!('state' in serializedContract)) throw new Error('Contract state not found')

    const contractAbi = contract.abi
    const reader = new StateReader(Buffer.from(serializedContract.state.data, 'base64'), contractAbi, serializedContract.avlTrees)
    const struct = reader.readStruct(contractAbi.getStateStruct())

    return struct
  }

  async getAbi(contractAddress?: string): Promise<ContractAbi> {
    if (!contractAddress) throw new Error('Contract address not found')

    let entry = this.contractRegistry.get(contractAddress)
    if (entry && entry.contract.abi && this.validTTL(entry.fetchedAt)) return entry.contract.abi

    const abi = await this.fetchContractAbi(contractAddress)
    if (!abi) throw new Error('Contract abi not found')

    entry = {
      fetchedAt: Date.now(),
      contract: {
        abi: abi.contract
      }
    }

    this.contractRegistry.set(contractAddress, entry)

    return entry?.contract.abi
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
      'low': 8_000,
      'medium': 40_000,
      'high': 50_000,
      'extra-high': 100_000,
    }

    let gas = gasTable.low
    if (gasCost) gas = typeof gasCost === 'number' ? gasCost : gasTable[gasCost]

    // Remove contract cache as the state will change
    this.cleanCache(contractAddress)

    switch (this.secrets.strategy) {
      case 'privateKey':
        return createTransactionFromPrivateKey(this.rpc, contractAddress, this.secrets.privateKey, payload, isMainnet, gas)

      case 'partisiaSdk':
        return createTransactionFromPartisiaClient(this.rpc, this.secrets.partisiaSdk, contractAddress, payload, gas)

      case 'MetaMask':
        return createTransactionFromMetaMaskClient(this.rpc, this.secrets.metaMask, contractAddress, payload, isMainnet, gas)

      case 'Ledger':
        return createTransactionFromLedgerClient(this.rpc, this.secrets.ledger, contractAddress, payload, isMainnet, gas)

      default:
        throw new Error('Signing strategy not found')
    }
  }

  private cleanCache(contractAddress: string) {
    this.contractRegistry.delete(contractAddress)
  }

  private async getContractFromRegistry({ contractAddress, force, withState, partial }: ContractParams): Promise<Contract | undefined> {
    if (!contractAddress) throw new Error('Contract address not specified')

    let contractEntry = this.contractRegistry.get(contractAddress)

    const serializedContract = contractEntry?.contract?.data?.serializedContract
    const hasPartialState = serializedContract?.state !== undefined
    const hasFullState = hasPartialState && serializedContract?.avlTrees !== undefined

    if (contractEntry && !force &&
      ((partial && hasPartialState) ||
        (withState && hasFullState) ||
        !withState) &&
      this.validTTL(contractEntry.fetchedAt))
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

  private async fetchContractAbi(contractAddress: string): Promise<FileAbi> {
    const encodedAbi = await this.avlClient.getContractAbi(contractAddress)
    if (!encodedAbi) throw new Error('Contract abi not found')

    return this.parseAbi(encodedAbi)
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
        const contract = await getRequest<RawContractData>(`${this.hostUrl}/shards/Shard${this.rpc.deriveShardId(contractAddress)}/blockchain/contracts/${contractAddress}?requireContractState=${normalizedOptions.withState}`)
        if (!contract) return

        const serializedContract = contract.serializedContract

        let avlTrees
        if (serializedContract?.avlTrees)
          avlTrees = convertAvlTrees(serializedContract.avlTrees)

        return {
          abi: contract.abi,
          serializedContract: {
            state: serializedContract?.state,
            avlTrees,
          }
        }
      })
    else
      contract = await promiseRetry(() => this.avlClient.getBinaryContractState(contractAddress))

    return contract
  }

  private validTTL(date: number): boolean {
    return (Date.now() - date) < this.ttl
  }
}
