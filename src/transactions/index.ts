import type { BlockchainTransactionClient, SentTransaction, TransactionTree } from "@partisiablockchain/blockchain-api-transaction-client"
import type { ITransactionIntent, ITransactionResult } from "../interface"
import type { SigningBackend } from "./authentication"

export type { SigningBackend } from "./authentication"
export { privateKeyBackend, ledgerBackend, metaMaskBackend, partisiaSdkBackend } from "./authentication"

/**
 * The blockchain address a private key signs for.
 *
 * Consumers derived this from `partisia-blockchain-applications-crypto`, which
 * is unmaintained and worth 300 KB of bundle; this is the same derivation over
 * the official client, and lives on the lazily loaded signing path.
 */
export const privateKeyToAddress = async (privateKey: string): Promise<string> => {
  const { privateKeyBackend } = await import("./authentication")

  return (await privateKeyBackend(privateKey)).authentication.getAddress()
}

/**
 * The nonce comes from a reader node, which trails the chain by a moment: a
 * transaction signed right after another one, or from a wallet that is also in
 * use elsewhere, can carry a nonce the chain has already spent. The node then
 * rejects the broadcast with 400 Bad Request. A rejected transaction never
 * reaches the chain, so re-reading the nonce and signing again is safe and
 * costs nothing -- as long as signing does not prompt a human, which is why
 * interactive backends get a single attempt.
 */
const BROADCAST_ATTEMPTS = 3

/** How long the chain will accept the transaction for. */
const DEFAULT_VALIDITY_MS = 120_000

/**
 * How long to wait for a single spawned event to be included in a block. The
 * client's own default is ten minutes, which outlives any caller that is
 * waiting on `fetchResult`.
 */
const DEFAULT_EVENT_TIMEOUT_MS = 30_000

export interface CreateTransactionParams {
  contractAddress: string
  payload: Buffer
  cost: number
  validityInMillis?: number
  eventTimeoutInMillis?: number
  /** Interactive signers are asked once; see `BROADCAST_ATTEMPTS`. */
  attempts?: number
}

/**
 * Sign a transaction with any of the signing backends and broadcast it.
 *
 * Signing, broadcasting and the wait for execution are all handled by the
 * official `@partisiablockchain/blockchain-api-transaction-client`, which talks
 * to the reader node's `/chain` API. The chain id is read from the node rather
 * than derived from the environment.
 */
export const createTransaction = async (
  hostUrl: string,
  { authentication, interactive }: SigningBackend,
  { contractAddress, payload, cost, validityInMillis = DEFAULT_VALIDITY_MS, eventTimeoutInMillis = DEFAULT_EVENT_TIMEOUT_MS, attempts }: CreateTransactionParams
): Promise<ITransactionIntent> => {
  const { BlockchainTransactionClient } = await import("@partisiablockchain/blockchain-api-transaction-client")

  const client = BlockchainTransactionClient.create(hostUrl, authentication, validityInMillis, eventTimeoutInMillis)
  const transaction = { address: contractAddress, rpc: payload }
  const broadcastAttempts = attempts ?? (interactive ? 1 : BROADCAST_ATTEMPTS)

  let lastError: unknown
  for (let attempt = 0; attempt < broadcastAttempts; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1_000 * attempt))

    try {
      const sentTransaction = await client.signAndSend(transaction, cost)

      return {
        transactionHash: sentTransaction.transactionPointer.identifier,
        fetchResult: transactionResult(client, sentTransaction),
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

const transactionResult = async (
  client: BlockchainTransactionClient,
  sentTransaction: SentTransaction
): Promise<ITransactionResult> => {
  const transactionHash = sentTransaction.transactionPointer.identifier

  try {
    const tree = await client.waitForSpawnedEvents(sentTransaction)

    return {
      transactionHash,
      hasError: tree.hasFailures(),
      errorMessage: tree.getFirstFailure()?.errorMessage,
      eventTrace: eventTrace(tree),
    }
  } catch (error) {
    // A transaction that never lands in a block, or an event that never
    // executes, is reported rather than thrown: callers await `fetchResult`
    // for the outcome, not for the network.
    return {
      transactionHash,
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'unable to broadcast to chain',
      eventTrace: [],
    }
  }
}

/**
 * Every event spawned by the transaction and by its events, in the order the
 * client walked them. The shard is the event's destination, which is not
 * necessarily the shard the parent executed on.
 */
const eventTrace = (tree: TransactionTree) => {
  return [tree.transaction, ...tree.events]
    .flatMap((transaction) => transaction.executionStatus?.events ?? [])
    .map((event) => ({
      txHash: event.identifier,
      shardId: Number(event.destinationShardId.replace('Shard', '')),
    }))
}
