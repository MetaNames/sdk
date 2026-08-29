import type { SenderAuthentication } from "@partisiablockchain/blockchain-api-transaction-client"
import type { ITransactionIntent } from "../interface"
import type { ShardedClient } from "../repositories/helpers/sharded-client"
import { buildTransactionResult, getChainId } from "./helper"
import assert from "assert"

export type { SigningBackend } from "./authentication"
export { privateKeyBackend, ledgerBackend, metaMaskBackend, partisiaSdkBackend } from "./authentication"

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

export interface CreateTransactionParams {
  contractAddress: string
  payload: Buffer
  cost: number
  isMainnet?: boolean
  /** How long the chain will accept the transaction for. */
  validityInMillis?: number
  /** Interactive signers are asked once; see `BROADCAST_ATTEMPTS`. */
  attempts?: number
}

/**
 * Sign a transaction with any of the signing backends and broadcast it.
 *
 * `SignedTransaction` comes from the official
 * `@partisiablockchain/blockchain-api-transaction-client`, which replaces the
 * unmaintained `partisia-blockchain-applications-crypto`. It produces the same
 * bytes: an inner part of nonce, valid-to and gas as big-endian i64s followed
 * by the contract address and the length-prefixed payload, signed over the
 * SHA-256 of those bytes concatenated with the length-prefixed chain id.
 */
export const createTransaction = async (
  client: ShardedClient,
  { authentication, interactive }: { authentication: SenderAuthentication, interactive: boolean },
  { contractAddress, payload, cost, isMainnet = false, validityInMillis = 120_000, attempts }: CreateTransactionParams
): Promise<ITransactionIntent> => {
  const { SignedTransaction } = await import("@partisiablockchain/blockchain-api-transaction-client")

  const walletAddress = authentication.getAddress()
  const shardId = client.deriveShardId(walletAddress)
  const chainId = getChainId(isMainnet)
  const broadcastAttempts = attempts ?? (interactive ? 1 : BROADCAST_ATTEMPTS)

  let lastError: unknown
  for (let attempt = 0; attempt < broadcastAttempts; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1_000 * attempt))

    const nonce = await client.getNonce(walletAddress, shardId)
    const signedTransaction = await SignedTransaction.create(
      authentication,
      nonce,
      Date.now() + validityInMillis,
      cost,
      chainId,
      { address: contractAddress, rpc: payload }
    )

    try {
      const isValid = await client.broadcastTransaction(walletAddress, signedTransaction.serialize())
      assert(isValid, 'Unknown Error')

      return buildTransactionResult(client, shardId, signedTransaction.identifier())
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}
