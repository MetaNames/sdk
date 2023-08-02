import { IPartisiaRpcConfig } from "partisia-rpc/lib/main/accountInfo"
import { ContractRepository } from "../contract-repository"
import { Contract, ContractParams, IMetaNamesContractRepository, ITransactionResult, MetaNamesState, TransactionParams } from "../../interface"

/**
 * Meta Names contract repository
 * It is a wrapper of ContractRepository that adds some defaults
 * @extends ContractRepository
 */
export class MetaNamesContractRepository extends ContractRepository implements IMetaNamesContractRepository {
  metaNamesContractAddress: string

  constructor(contractAddress: string, rpc: IPartisiaRpcConfig) {
    super(rpc)
    this.metaNamesContractAddress = contractAddress
  }

  async getContract(params: ContractParams = { contractAddress: this.metaNamesContractAddress, force: true, withState: true }): Promise<Contract> {
    return super.getContract(params)
  }

  /**
   * Get the Meta Names contract state
   */
  async getState(): Promise<MetaNamesState> {
    return super.getState({
      contractAddress: this.metaNamesContractAddress,
      force: true,
      withState: true
    })
  }

  async createTransaction({ payload }: TransactionParams): Promise<ITransactionResult> {
    return super.createTransaction({ contractAddress: this.metaNamesContractAddress, payload })
  }
}
