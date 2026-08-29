import type LedgerTransport from "@ledgerhq/hw-transport"
import type { ITransactionIntent, MetaMaskSdk } from "../interface"
import { buildTransactionResult, getChainId, serializeTransaction } from "./helper"
import type { ShardedClient } from "../repositories/helpers/sharded-client"
import assert from "assert"
import type PartisiaSdk from "partisia-blockchain-applications-sdk"

/**
 * The signing backends are loaded on demand.
 *
 * `partisia-blockchain-applications-crypto` pulls in bip39, elliptic and
 * tiny-secp256k1 (~500 KB); the Ledger client pulls in `bip32-path` and the
 * `@ledgerhq` transport. All three stay regular dependencies, so nothing extra
 * has to be installed, but a bundler splits them out of the entry chunk: a
 * consumer that only reads contract state never downloads them, one that signs
 * with MetaMask does not pay for the Ledger transport, and one that signs with
 * a Ledger does not pay for the BIP-39 wordlists.
 */
const loadTransactionCrypto = () => import("partisia-blockchain-applications-crypto/lib/main/transaction")
const loadWalletCrypto = () => import("partisia-blockchain-applications-crypto/lib/main/wallet")
const loadLedgerClient = () => import("./ledger")

export const createTransactionFromLedgerClient = async (
  rpc: ShardedClient,
  transport: LedgerTransport,
  contractAddress: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 10490
): Promise<ITransactionIntent> => {
  const [{ PartisiaLedgerClient, signatureToBuffer }, { deriveDigest, getTrxHash }] = await Promise.all([
    loadLedgerClient(),
    loadTransactionCrypto()
  ])

  const client = new PartisiaLedgerClient(transport)
  const walletAddress: string = await client.getAddress()
  const shardId = rpc.deriveShardId(walletAddress)

  const serializedTransaction = await serializeTransaction(rpc, walletAddress, contractAddress, payload, cost)
  const chainId = getChainId(isMainnet)
  const digest = deriveDigest( chainId, serializedTransaction)

  const signature = await client.signTransaction(serializedTransaction, chainId)

  const signatureBuffer = signatureToBuffer(signature)

  const transactionPayload = Buffer.concat([signatureBuffer, serializedTransaction]).toString('base64')

  const transactionHash = getTrxHash(digest, signatureBuffer)
  const isValid = await rpc.broadcastTransaction(walletAddress, transactionPayload)
  assert(isValid, 'Unknown Error')

  return buildTransactionResult(rpc, shardId, transactionHash)
}

export const createTransactionFromMetaMaskClient = async (
  rpc: ShardedClient,
  client: MetaMaskSdk,
  contractAddress: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 10490
): Promise<ITransactionIntent> => {
  const { deriveDigest, getTrxHash } = await loadTransactionCrypto()

  const snapId = "npm:@partisiablockchain/snap"
  const walletAddress: string = await client.request({
    method: "wallet_invokeSnap",
    params: { snapId, request: { method: "get_address" } },
  })
  const shardId = rpc.deriveShardId(walletAddress)

  const serializedTransaction = await serializeTransaction(rpc, walletAddress, contractAddress, payload, cost)
  const chainId = getChainId(isMainnet)
  const digest = deriveDigest(
    chainId,
    serializedTransaction
  )

  const signatureHex: string = await client.request({
    method: "wallet_invokeSnap",
    params: {
      snapId,
      request: {
        method: "sign_transaction",
        params: {
          payload: serializedTransaction.toString("hex"),
          chainId
        },
      },
    },
  })
  const signature = Buffer.from(signatureHex, "hex")
  assert(signature.length === 65)

  const transactionPayload = Buffer.concat([signature, serializedTransaction]).toString('base64')

  const transactionHash = getTrxHash(digest, signature)
  const isValid = await rpc.broadcastTransaction(walletAddress, transactionPayload)
  assert(isValid, 'Unknown Error')

  return buildTransactionResult(rpc, shardId, transactionHash)
}

export const createTransactionFromPartisiaClient = async (
  rpc: ShardedClient,
  client: PartisiaSdk,
  contractAddress: string,
  payload: Buffer,
  cost: number | string = 8490
): Promise<ITransactionIntent> => {
  if (!client.connection) throw new Error('Client is not connected')

  const walletAddress = client.connection.account.address
  const serializedTransaction = await serializeTransaction(rpc, walletAddress, contractAddress, payload, cost)

  const transaction = await client.signMessage({
    payload: serializedTransaction.toString("hex"),
    payloadType: "hex",
    dontBroadcast: false,
  })

  const shardId = rpc.deriveShardId(walletAddress)

  return buildTransactionResult(rpc, shardId, transaction.trxHash)
}

/**
 * The nonce comes from a reader node, which trails the chain by a moment: a
 * transaction signed right after another one, or from a wallet that is also in
 * use elsewhere, can carry a nonce the chain has already spent. The node then
 * rejects the broadcast with 400 Bad Request. A rejected transaction never
 * reaches the chain, so re-reading the nonce and signing again is safe and
 * costs nothing.
 */
const BROADCAST_ATTEMPTS = 3

export const createTransactionFromPrivateKey = async (
  rpc: ShardedClient,
  contractAddress: string,
  privateKey: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 8490
): Promise<ITransactionIntent> => {
  const [{ deriveDigest, getTransactionPayloadData, getTrxHash }, { privateKeyToAccountAddress, signTransaction }] = await Promise.all([
    loadTransactionCrypto(),
    loadWalletCrypto()
  ])

  const walletAddress = privateKeyToAccountAddress(privateKey)
  const shardId = rpc.deriveShardId(walletAddress)

  let lastError: unknown
  for (let attempt = 0; attempt < BROADCAST_ATTEMPTS; attempt++) {
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, 1_000 * attempt))

    const serializedTransaction = await serializeTransaction(rpc, walletAddress, contractAddress, payload, cost)

    const digest = deriveDigest(
      `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`,
      serializedTransaction
    )
    const signature = signTransaction(digest, privateKey)
    const trx = getTransactionPayloadData(serializedTransaction, signature)

    const transactionHash = getTrxHash(digest, signature)

    try {
      const isValid = await rpc.broadcastTransaction(walletAddress, trx)
      assert(isValid, 'Unknown Error')

      return buildTransactionResult(rpc, shardId, transactionHash)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}
