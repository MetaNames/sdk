import { ContractAbi, ScValueStruct } from "@partisiablockchain/abi-client-ts"

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

export interface IContractRepository {
  createTransaction(payload: Buffer): Promise<ITransactionResult>
  getContractAbi(): Promise<ContractAbi>
  getState(): Promise<MetaNamesState>
}

export interface IValidatorInterface {
  normalize(value: string): string
  validate(value: string): boolean
}
