import { Buffer } from "buffer"
import { postRequest } from "./client"

export interface ShardedClientConfig {
  urlBaseGlobal: { url: string, shard_id: number }
  urlBaseShards: { url: string, shard_id: number }[]
}

export interface GlobalCoins {
  coins: {
    symbol: string
    conversionRate: { numerator: string, denominator: string }
  }[]
}

/**
 * Minimal reader-node client for the Partisia REST API.
 *
 * Replaces `partisia-blockchain-applications-rpc`, which is unmaintained (last
 * published 2024-03-18) and pulled axios in for what are plain GET/POST calls.
 * Transactions no longer go through here: signing, broadcasting and waiting are
 * handled by the official transaction client, see `src/transactions`.
 */
export class ShardedClient {
  private readonly globalUrl: string
  private readonly shards: { url: string, shard_id: number }[]

  constructor(config: ShardedClientConfig) {
    this.globalUrl = config.urlBaseGlobal.url
    this.shards = config.urlBaseShards
  }

  /**
   * Derive which shard an address lives on.
   *
   * Port of `PartisiaAccountClass.deriveShardId`, itself a port of the core
   * dashboard's `ShardedClient.ts`: the big-endian int32 at byte offset 17 of
   * the address, modulo the shard count.
   */
  deriveShardId(address: string | Buffer): number {
    const buf = typeof address === 'string' ? Buffer.from(address, 'hex') : address
    const int32 = Math.abs(buf.readInt32BE(17))

    return int32 % this.shards.length
  }

  async fetchCoins(): Promise<GlobalCoins> {
    const coins = await postRequest<GlobalCoins>(
      `${this.globalUrl}/blockchain/accountPlugin/global`,
      { path: [{ type: "field", name: "coins" }] }
    )
    if (!coins) throw new Error('Unable to fetch coins')

    return coins
  }
}
