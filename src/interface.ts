export type Address = string

export interface IOwner {
  owner: string
}

export interface IDomain {
  // token owner
  owner: Address
  // Parent
  parent?: string
  // token approvals
  approvals: Address[]
}

export enum RecordClassEnum {
  Wallet = 0,
  Uri = 1,
  Twitter = 2,
}

export interface IRecord {
  // Related domain
  domain: string
  // Class type
  class: RecordClassEnum
  // Data
  data: string
}

export interface IOperatorApprovals {
  [address: string]: { [address: string]: boolean }
}

export interface IPartisiaNameSystemState {
  // optional owner address
  owner?: IOwner
  // token name
  name: string
  // token symbol
  symbol: string
  // optional base uri
  base_uri?: string
  // minter address
  minter: Address
  // Token supply
  supply: number
  // domains are token id
  // Token id is currently a string (the domain name)
  tokens: { key: string; value: IDomain }[]
  // record info by record_class.token_id
  records: { key: string; value: IRecord }[]
  // token approvals
  operator_approvals: IOperatorApprovals
}

export interface IContractVersionState {
  name: string
  version: string
}

export interface IMetaNamesState {
  pns: IPartisiaNameSystemState
  version: IContractVersionState
}

export interface IActionMint {
  token_id: string
  to: Buffer
  parent?: string
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
