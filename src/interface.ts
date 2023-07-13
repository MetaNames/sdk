export type Address = string

export interface IOwner {
  owner: string
}

export interface IDomain {
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

export interface IActionRecordMint {
  domain: string
  class: RecordClassEnum
  data: string | Buffer
}

export interface IActionRecordUpdate {
  domain: string
  class: RecordClassEnum
  data: string | Buffer
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
