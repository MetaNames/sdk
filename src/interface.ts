/* eslint-disable no-unused-vars */

import type { BN, ContractAbi, FileAbi, ScValueStruct } from "@partisiablockchain/abi-client"
import type { IContractInfo } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import type PartisiaSdk from "partisia-blockchain-applications-sdk"
import type { BYOCSymbol } from "./providers"

// TODO: Reorganize this file

export type GasCost = 'low' | 'medium' | 'high' | 'extra-high'

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

export type Records = Record<string, string | Buffer>

export interface IDomainPartial extends Omit<IDomain, 'owner'> {
  owner?: string
}

export interface IDomain {
  name: string
  tld: string
  createdAt: Date
  expiresAt?: Date
  owner: string
  tokenId: number
  parentId?: string
  records: Records
}

export interface IDomainAnalyzed {
  name: string,
  parentId?: string,
  tld: string,
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
  amount: BN
}

interface ICommonDomain {
  domain: string
  subscriptionYears?: number
}

interface IActionCommontDomainMint extends ICommonDomain {
  to: Address
  parentDomain?: string
}
export interface IActionDomainMintPayload extends IActionCommontDomainMint {
  byocTokenId: number
  tokenUri: string
}

export interface IActionDomainMint extends IActionCommontDomainMint {
  byocSymbol: BYOCSymbol
}

interface IActionCommonDomainRenew extends ICommonDomain {
  payer: Address
}

export interface IActionDomainRenewal extends IActionCommonDomainRenew {
  byocSymbol: BYOCSymbol
}

export interface IActionRenewDomainPayload extends IActionCommonDomainRenew {
  byocTokenId: number
}

export interface IActionDomainTransfer {
  from: Address
  to: Address
  domain: string
}

export interface IActionDomainTransferPayload extends Omit<IActionDomainTransfer, 'domain'> {
  tokenId: number
}

export interface ByocCoin {
  conversionRate: {
    unit_value: number
    scale_factor: number
  }
  symbol: string
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
  transactionHash: string
  hasError: boolean
  errorMessage?: string
  eventTrace: {
    txHash: string;
    shardId: number;
  }[]
}

export interface ITransactionIntent {
  transactionHash: string
  fetchResult: Promise<ITransactionResult>
}

export type MetaNamesState = ScValueStruct

export type RawContractData = Pick<IContractInfo, 'abi' | 'serializedContract'> & { serializedContract: { avlTrees: AvlTree[] } }
export type ContractData = Pick<IContractInfo, 'abi' | 'serializedContract'> & { serializedContract: { avlTrees?: Map<number, [Buffer, Buffer][]> } };


export interface ContractParams {
  contractAddress?: string
  force?: boolean
  withState?: boolean
  partial?: boolean
}

export interface Contract {
  data: ContractData
  abi: ContractAbi
}

export interface TransactionParams {
  contractAddress?: string
  payload: Buffer
  gasCost?: GasCost | number
}

export interface IContractRepository {
  createTransaction(params: TransactionParams): Promise<ITransactionIntent>
  getContract(params?: ContractParams): Promise<Contract>
  getState(params?: ContractParams): Promise<ScValueStruct>
  getByocCoins(): Promise<ByocCoin[]>
  getAbi(contractAddress?: string): Promise<FileAbi>
}

export interface GetStateParams {
  force?: boolean,
  partial?: boolean
}

export enum MetaNamesAvlTrees {
  domains = 0,
  owners = 2
}

export interface IMetaNamesContractRepository extends IContractRepository {
  getState(options?: GetStateParams): Promise<MetaNamesState>
  getContractAddress(): Promise<string>
  getStateAvlValue(treeId: MetaNamesAvlTrees, key: Buffer): Promise<Buffer | undefined>
  getStateAvlTree(treeId: MetaNamesAvlTrees): Promise<Array<Record<string, string>> | undefined>
}

export interface IValidatorOptions {
  raiseError?: boolean
}

export interface IValidatorInterface<T> {
  errors: string[]

  get rules(): object
  normalize(value: T, options: IValidatorOptions): T
  validate(value: T, options: IValidatorOptions): boolean
}

export interface AvlTreeItem {
  key: {
    data: {
      data: string;
    };
  };
  value: {
    data: string;
  };
}

export interface AvlTree {
  key: number;
  value: {
    avlTree: AvlTreeItem[];
  };
}

export interface ContractEntry {
  contract: Contract
  fetchedAt: number
}
