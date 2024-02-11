import { IPartisiaRpcConfig } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import { ContractRepository } from "../contract-repository"
import { Contract, ContractParams, IMetaNamesContractRepository, ITransactionIntent, MetaNamesState, TransactionParams } from "../../interface"
import { Enviroment } from "../../providers"
import { SecretsProvider } from "../../providers/secrets"

/**
 * Meta Names contract repository
 * It is a wrapper of ContractRepository that adds some defaults
 * @extends ContractRepository
 */
export class MetaNamesContractRepository extends ContractRepository implements IMetaNamesContractRepository {
  private metaNamesContractAddress: string

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig, environment: Enviroment, secrets: SecretsProvider) {
    super(rpc, environment, secrets)
    this.metaNamesContractAddress = contractAddress
  }

  async getContract(params: ContractParams = { contractAddress: this.metaNamesContractAddress, force: true, withState: true }): Promise<Contract> {
    return super.getContract(params)
  }

  /**
   * Get the Meta Names contract state
   */
  async getState(params?: { force?: boolean }): Promise<MetaNamesState> {
    if (!params) params = { force: true }

    return super.getState({
      contractAddress: this.metaNamesContractAddress,
      force: params.force,
      withState: true
    })
  }

  async createTransaction({ payload, gasCost }: TransactionParams): Promise<ITransactionIntent> {
    return super.createTransaction({ contractAddress: this.metaNamesContractAddress, payload, gasCost })
  }
}
