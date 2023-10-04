/* eslint-disable no-unused-vars */

import { ContractAbi, ScValueStruct } from "@partisiablockchain/abi-client-ts"
import { IContractInfo } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import { IContractZk } from "partisia-blockchain-applications-rpc/lib/main/interface-zk"
import PartisiaSdk from "partisia-sdk"

// TODO: Reorganize this file

export type GasCost = 'low' | 'high'

export type SigningStrategyType = 'privateKey' | 'partisiaSdk' | 'MetaMask'
export type SigningClassType = string | PartisiaSdk | MetaMaskSdk

export interface MetamaskRequestArguments {
  /** The RPC method to request. */
  method: string;
  /** The params of the RPC method, if any. */
  params?: unknown[] | Record<string, unknown>;
}

export interface MetaMaskSdk {
  request<T>(args: MetamaskRequestArguments): Promise<T>;
}

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
  Avatar = 5,
  // Custom = 6,
  // Custom2 = 7,
  // Custom3 = 8,
  // Custom4 = 9,
  // Custom5 = 10,
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
  gasCost?: GasCost
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
