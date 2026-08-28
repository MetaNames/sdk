import { Buffer } from "buffer"
import { getRequest, postRequest, putRequestOnce } from "./client"

export interface ShardedClientConfig {
  urlBaseGlobal: { url: string, shard_id: number }
  urlBaseShards: { url: string, shard_id: number }[]
}

export interface AccountInfo {
  nonce?: number
}

export interface TransactionInfo {
  identifier: string
  executionSucceeded: boolean
  finalized: boolean
  events: { identifier: string, destinationShard: string }[]
  failureCause?: { errorMessage: string }
}

export interface GlobalCoins {
  coins: {
    symbol: string
    conversionRate: { numerator: string, denominator: string }
  }[]
}

export interface EventTrace {
  hasError: boolean
  errorMessage?: string
  eventTrace: { txHash: string, shardId: number }[]
}

/**
 * Minimal reader-node client for the Partisia REST API.
 *
 * Replaces `partisia-blockchain-applications-rpc`, which is unmaintained (last
 * published 2024-03-18) and pulled axios in for what are plain GET/POST/PUT
 * calls. The endpoints and the shard derivation below match that package's
 * behaviour exactly; see the notes on each method.
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

  shardUrl(shardId: number): string {
    const shard = this.shards.find((s) => s.shard_id === shardId)
    if (!shard) throw new Error(`Unknown shard ${shardId}`)

    return shard.url
  }

  shardUrlForAddress(address: string): string {
    return this.shardUrl(this.deriveShardId(address))
  }

  /**
   * An address with no on-chain account has no nonce; the chain treats the
   * first transaction from it as nonce 1, so a missing account is not an error.
   */
  async getNonce(address: string, shardId?: number): Promise<number> {
    const url = this.shardUrl(shardId ?? this.deriveShardId(address))
    const account = await getRequest<AccountInfo>(`${url}/blockchain/account/${address}`)

    return account?.nonce ?? 1
  }

  async fetchCoins(): Promise<GlobalCoins> {
    const coins = await postRequest<GlobalCoins>(
      `${this.globalUrl}/blockchain/accountPlugin/global`,
      { path: [{ type: "field", name: "coins" }] }
    )
    if (!coins) throw new Error('Unable to fetch coins')

    return coins
  }

  /**
   * A transaction hash does not encode its shard, so with no `shardId` every
   * shard is queried and the first that knows the transaction wins. This is
   * what the rpc package did, and callers such as the event-trace walker rely
   * on it.
   */
  async getTransaction(transactionHash: string, shardId?: number, requireFinal = false): Promise<TransactionInfo | undefined> {
    const path = `/blockchain/transaction/${transactionHash}?requireFinal=${requireFinal}`

    if (shardId !== undefined) {
      return getRequest<TransactionInfo>(`${this.shardUrl(shardId)}${path}`)
    }

    const results = await Promise.all(
      this.shards.map((shard) =>
        getRequest<TransactionInfo>(`${shard.url}${path}`).catch(() => undefined)
      )
    )

    return results.find((transaction) => transaction !== undefined)
  }

  broadcastTransaction(addressFrom: string, payload: string | Buffer): Promise<boolean> {
    const url = this.shardUrlForAddress(addressFrom)
    const transactionPayload = typeof payload === 'string' ? payload : payload.toString('base64')

    return putRequestOnce(`${url}/blockchain/transaction`, { transactionPayload })
  }

  /**
   * Walk a transaction and every event it spawned, collecting failures.
   *
   * Mirrors `PartisiaAccountClass.getTransactionEventTrace`. Spawned events
   * land on the shard named in `destinationShard` ("Shard1" -> 1), which is why
   * each recursive lookup re-targets rather than reusing the parent's shard.
   */
  async getTransactionEventTrace(transactionHash: string, shardId?: number): Promise<EventTrace> {
    const transaction = await this.pollTransaction(transactionHash, shardId)

    const result: EventTrace = {
      hasError: !transaction.executionSucceeded,
      errorMessage: transaction.executionSucceeded ? undefined : transaction.failureCause?.errorMessage,
      eventTrace: transaction.events.map((event) => ({
        txHash: event.identifier,
        shardId: shardIdFromDestination(event.destinationShard),
      })),
    }

    for (const event of transaction.events) {
      await this.collectEvents(event.identifier, shardIdFromDestination(event.destinationShard), result)
    }

    return result
  }

  private async collectEvents(transactionHash: string, shardId: number, result: EventTrace): Promise<void> {
    const transaction = await this.pollTransaction(transactionHash, shardId)

    if (!transaction.executionSucceeded) {
      result.hasError = true
      result.errorMessage = transaction.failureCause?.errorMessage
    }

    for (const event of transaction.events) {
      const eventShardId = shardIdFromDestination(event.destinationShard)
      result.eventTrace.push({ txHash: event.identifier, shardId: eventShardId })
      await this.collectEvents(event.identifier, eventShardId, result)
    }
  }

  /**
   * The transaction is known to exist; it may not have propagated to the
   * reader node yet. Retries until it is finalized.
   */
  private async pollTransaction(transactionHash: string, shardId?: number, attempts = 30, intervalInMillis = 1000): Promise<TransactionInfo> {
    for (let attempt = 0; attempt < attempts; attempt++) {
      const transaction = await this.getTransaction(transactionHash, shardId).catch(() => undefined)

      if (transaction?.finalized) return transaction

      await new Promise((resolve) => setTimeout(resolve, intervalInMillis))
    }

    throw new Error(`Transaction ${transactionHash} was not finalized in time`)
  }
}

/** "Shard1" -> 1 */
function shardIdFromDestination(destinationShard: string): number {
  return Number(destinationShard.replace('Shard', ''))
}
