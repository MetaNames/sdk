import { ContractAbi, ScValueStruct } from "@partisiablockchain/abi-client-ts"
import { IContractInfo } from "partisia-rpc/lib/main/accountInfo"
import { IContractZk } from "partisia-rpc/lib/main/interface-zk"

// TODO: Reorganize this file

export interface IDomain {
  name: string
  tokenId: number
  parentId?: string
  records: Map<string, string | Buffer>
}

export enum RecordClassEnum {
  Bio = 0,
  Discord = 1,
  Twitter = 2,
  Uri = 3,
  Wallet = 4,
  // Custom = 5,
  // Custom2 = 6,
  // Custom3 = 7,
  // Custom4 = 8,
  // Custom5 = 9,
}

export interface IActionRecordMint extends IRecord {
  domain: string
}

export interface IActionRecordUpdate extends IRecord {
  domain: string
}

export interface IRecord {
  data: string | Buffer
  class: RecordClassEnum
}

export interface IActionRecordDelete {
  domain: string
  class: RecordClassEnum
}

export interface IActionApproveMintFees {
  address: Buffer
  amount: number
}

export interface IActionDomainMint {
  domain: string
  to: Buffer
  token_uri?: string
  parent_domain?: string
}

export interface IArgMint {
  typeIndex: number
  valStruct: IStructMint[]
}

export interface IStructMint {
  typeIndex: number
  valPrimitive: string
}

export interface ITransactionResult {
  isFinalOnChain: boolean
  trxHash: string
  hasError: boolean
  errorMessage?: string
}

export type MetaNamesState = ScValueStruct

export type ContractParams = {
  contractAddress: string
  force?: boolean
  withState?: boolean
}

export type Contract = {
  shard_id: number
  data: IContractInfo | IContractZk
  abi: ContractAbi
}

export type TransactionParams = {
  contractAddress?: string
  payload: Buffer
}

export interface IContractRepository {
  createTransaction(params: TransactionParams): Promise<ITransactionResult>
  getContract(params?: ContractParams): Promise<Contract>
}

export interface IMetaNamesContractRepository extends IContractRepository {
  getState(): Promise<MetaNamesState>
}

export interface IValidatorInterface<T> {
  normalize(value: T): T
  validate(value: T): boolean
}
