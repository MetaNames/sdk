/* eslint-disable no-unused-vars */

import { ContractAbi, ScValueStruct } from "@partisiablockchain/abi-client-ts"
import { IContractInfo } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import { IContractZk } from "partisia-blockchain-applications-rpc/lib/main/interface-zk"

// TODO: Reorganize this file

export interface IDomain {
  name: string
  tld: string
  owner: string
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

export type Address = Buffer | string

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
  address: Address
  amount: number
}

export interface IActionDomainMint {
  domain: string
  to: Address
  tokenUri?: string
  parentDomain?: string
  subscriptionYears?: number
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

export interface ContractParams {
  contractAddress: string
  force?: boolean
  withState?: boolean
}

export interface Contract {
  shard_id: number
  data: IContractInfo | IContractZk
  abi: ContractAbi
}

export interface TransactionParams {
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

export interface IValidatorOptions {
  raiseError?: boolean
}

export interface IValidatorInterface<T> {
  errors: string[]

  get rules(): Object
  normalize(value: T, options: IValidatorOptions): T
  validate(value: T, options: IValidatorOptions): boolean
}
