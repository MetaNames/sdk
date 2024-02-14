import { IPartisiaRpcConfig } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import { ContractRepository } from "../contract-repository"
import { Contract, ContractParams, IMetaNamesContractRepository, ITransactionIntent, MetaNamesState, TransactionParams } from "../../interface"
import { Enviroment } from "../../providers"
import { SecretsProvider } from "../../providers/secrets"
import { getAddressFromProxyContractState } from "../helpers/contract"

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
    if (!params) {
      const metaNamesContractAddress = await this.getContractAddress()
      params = { contractAddress: metaNamesContractAddress }
    }

    return super.getContract(params)
  }

  /**
   * Get the Meta Names contract state
   * By default it will get the cached state
   */
  async getState(params?: { force?: boolean }): Promise<MetaNamesState> {
    if (!params) params = {}
    const metaNamesContractAddress = await this.getContractAddress()

    return super.getState({
      contractAddress: metaNamesContractAddress,
      force: params.force,
      withState: true
    })
  }

  async createTransaction({ payload, gasCost }: TransactionParams): Promise<ITransactionIntent> {
    const metaNamesContractAddress = await this.getContractAddress()

    return super.createTransaction({ contractAddress: metaNamesContractAddress, payload, gasCost })
  }

  async getContractAddress() {
    const contract = await super.getState({ contractAddress: this.proxyAddress, withState: true })
    const metaNamesAddress = getAddressFromProxyContractState(contract)

    return metaNamesAddress
  }
}
