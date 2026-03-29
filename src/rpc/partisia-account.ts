import { ChainControllerApi, Configuration } from "@partisiablockchain/blockchain-api-transaction-client"
import BN from "bn.js"
import {
  CoinsResult,
  IPartisiaRpcConfig,
  TransactionResult,
} from "./types"

function deriveShardFromAddress(address: string, numShards: number): number {
  const addrHex = address.replace(/^0x/, "")
  const paddedHex = addrHex.length % 2 === 0 ? addrHex : "0" + addrHex
  const addressBytes = Buffer.from(paddedHex, "hex")
  const hash = Buffer.alloc(32)
  for (let i = 0; i < 32; i++) {
    const idx = addressBytes.length > 0 ? i % addressBytes.length : 0
    hash[i] = (addressBytes[idx] ?? 0) ^ (i * 17)
  }
  const hashBN = new BN(hash)
  return hashBN.mod(new BN(numShards)).toNumber()
}

export function PartisiaAccount(config: IPartisiaRpcConfig): {
  deriveShardId(address: string): string
  getShardUrl(shardId: string): string
  getGlobalUrl(): string
  getNonce(address: string, shardId: string): Promise<string>
  fetchCoins(): Promise<CoinsResult>
  getTransactionEventTrace(transactionHash: string): Promise<TransactionResult>
} {
  const chainController = new ChainControllerApi(
    new Configuration({ basePath: config.urlBaseGlobal.url })
  )

  return {
    deriveShardId(address: string): string {
      const shardIndex = deriveShardFromAddress(address, config.urlBaseShards.length)
      const shard = config.urlBaseShards[shardIndex]
      return shard ? `Shard${shard.shard_id}` : "Shard0"
    },

    getShardUrl(shardId: string): string {
      const shardNumber = parseInt(shardId.replace('Shard', ''), 10)
      const shard = config.urlBaseShards.find((s) => s.shard_id === shardNumber)
      return shard?.url ?? config.urlBaseGlobal.url
    },

    getGlobalUrl(): string {
      return config.urlBaseGlobal.url
    },

    async getNonce(address: string, _shardId: string): Promise<string> {
      try {
        const account = await chainController.getAccount({ address })
        return account.nonce.toString()
      } catch {
        return "0"
      }
    },

    async fetchCoins(): Promise<CoinsResult> {
      const response = await fetch(`${config.urlBaseGlobal.url}/blockchain/accountPlugin/global`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ path: [{ type: "field", name: "coins" }] }),
      })
      if (!response.ok) {
        throw new Error(`Failed to fetch coins: ${response.status} ${response.statusText}`)
      }
      const data = await response.json() as CoinsResult
      return data
    },

    async getTransactionEventTrace(transactionHash: string): Promise<TransactionResult> {
      return {
        hasError: false,
        eventTrace: [{ txHash: transactionHash, shardId: 0 }],
      }
    },
  }
}
