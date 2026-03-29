import type { Contract, SerializedTransaction, TransactionPointer } from "@partisiablockchain/blockchain-api-transaction-client"

export interface UrlBaseGlobal {
  url: string
  shard_id: number
}

export interface UrlBaseShard {
  shard_id: number
  url: string
}

export interface IPartisiaRpcConfig {
  urlBaseGlobal: UrlBaseGlobal
  urlBaseShards: UrlBaseShard[]
}

export interface Coin {
  conversionRate: {
    numerator: string
    denominator: string
  }
  symbol: string
}

export interface CoinsResult {
  coins: Coin[]
}

export interface IContractInfo {
  abi: string
  serializedContract?: {
    state?: {
      data: string
    }
    avlTrees?: unknown
  }
}

export interface TransactionEventTrace {
  txHash: string
  shardId: number
}

export interface TransactionResult {
  hasError: boolean
  errorMessage?: string
  eventTrace: TransactionEventTrace[]
}

export interface PartisiaRpcClass {
  getTransaction(trxHash: string): Promise<{ finalized: boolean }>
  broadcastTransaction(transactionPayload: string): Promise<boolean>
}

export interface PartisiaAccountClass {
  deriveShardId(address: string): string
  getShardUrl(shardId: string): string
  getGlobalUrl(): string
  getNonce(address: string, shardId: string): Promise<string>
  fetchCoins(): Promise<CoinsResult>
  getTransactionEventTrace(transactionHash: string): Promise<TransactionResult>
}
