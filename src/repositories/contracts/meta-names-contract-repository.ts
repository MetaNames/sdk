import { IPartisiaRpcConfig } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import { ContractRepository } from "../contract-repository"
import { Contract, ContractParams, IMetaNamesContractRepository, ITransactionIntent, MetaNamesState, TransactionParams, GetStateParams } from "../../interface"
import { Enviroment } from "../../providers"
import { SecretsProvider } from "../../providers/secrets"
import { getAddressFromProxyContractState } from "../helpers/contract"
import { FileAbi } from "@partisiablockchain/abi-client"
import { AxiosError } from "axios"

/**
 * Meta Names contract repository
 * It is a wrapper of ContractRepository that adds some defaults
 * @extends ContractRepository
 */
export class MetaNamesContractRepository extends ContractRepository implements IMetaNamesContractRepository {
  private proxyAddress: string

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig, environment: Enviroment, secrets: SecretsProvider, ttl: number) {
    super(rpc, environment, secrets, ttl)
    this.proxyAddress = contractAddress
  }

  async getContract(params?: ContractParams): Promise<Contract> {
    if (!params?.contractAddress) {
      const metaNamesContractAddress = await this.getContractAddress()
      params = { contractAddress: metaNamesContractAddress }
    }

    return super.getContract(params)
  }

  /**
   * Get the Meta Names contract state
   * By default it will get the cached state
   */
  async getState(params?: GetStateParams): Promise<MetaNamesState> {
    if (!params) params = {}
    const metaNamesContractAddress = await this.getContractAddress()

    return super.getState({
      contractAddress: metaNamesContractAddress,
      force: params.force,
      partial: params.partial
    })
  }

  async getAbi(): Promise<FileAbi> {
    const metaNamesContractAddress = await this.getContractAddress()
    return super.getAbi(metaNamesContractAddress)
  }

  /**
   * Get the AVL value from the Meta Names contract state
   * @param treeId avl tree id
   * @param key avl key
   */
  async getStateAvlValue(treeId: number, key: Buffer): Promise<Buffer | undefined> {
    const metaNamesContractAddress = await this.getContractAddress()

    try {
      const buffer = await this.avlClient.getContractStateAvlValue(metaNamesContractAddress, treeId, key)
      return buffer
    } catch (e) {
      if (e instanceof AxiosError && e.response?.status === 404) return
      else console.log(e)
    }
  }

  async createTransaction({ payload, gasCost }: TransactionParams): Promise<ITransactionIntent> {
    const metaNamesContractAddress = await this.getContractAddress()

    return super.createTransaction({ contractAddress: metaNamesContractAddress, payload, gasCost })
  }

  async getContractAddress() {
    const contract = await super.getState({ contractAddress: this.proxyAddress, partial: true })
    const metaNamesAddress = getAddressFromProxyContractState(contract)

    return metaNamesAddress
  }
}
