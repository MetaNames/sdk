import { PartisiaAccountClass } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import type LedgerTransport from "@ledgerhq/hw-transport"
import { ITransactionIntent, MetaMaskSdk } from "../interface"
import { PartisiaLedgerClient, signatureToBuffer } from "./ledger"
import { buildTransactionResult, getChainId, serializeTransaction } from "./helper"
import { deriveDigest, getTransactionPayloadData, getTrxHash } from "partisia-blockchain-applications-crypto/lib/main/transaction"
import { PartisiaRpc } from "partisia-blockchain-applications-rpc"
import assert from "assert"
import PartisiaSdk from "partisia-blockchain-applications-sdk"
import { privateKeyToAccountAddress, signTransaction } from "partisia-blockchain-applications-crypto/lib/main/wallet"

export const createTransactionFromLedgerClient = async (
  rpc: PartisiaAccountClass,
  transport: LedgerTransport,
  contractAddress: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 10490
): Promise<ITransactionIntent> => {
  const client = new PartisiaLedgerClient(transport)
  const walletAddress: string = await client.getAddress()
  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)

  const serializedTransaction = await serializeTransaction(rpc, walletAddress, contractAddress, payload, cost)
  const chainId = getChainId(isMainnet)
  const digest = deriveDigest( chainId, serializedTransaction)

  const signature = await client.signTransaction(serializedTransaction, chainId)

  const signatureBuffer = signatureToBuffer(signature)

  const transactionPayload = Buffer.concat([signatureBuffer, serializedTransaction]).toString('base64')

  const rpcShard = PartisiaRpc({ baseURL: url })
  const transactionHash = getTrxHash(digest, signatureBuffer)
  const isValid = await rpcShard.broadcastTransaction(transactionPayload)
  assert(isValid, 'Unknown Error')

  return buildTransactionResult(rpc, rpcShard, transactionHash)
}

export const createTransactionFromMetaMaskClient = async (
  rpc: PartisiaAccountClass,
  client: MetaMaskSdk,
  contractAddress: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 10490
): Promise<ITransactionIntent> => {
  const snapId = "npm:@partisiablockchain/snap"
  const walletAddress: string = await client.request({
    method: "wallet_invokeSnap",
    params: { snapId, request: { method: "get_address" } },
  })
  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)

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

  const rpcShard = PartisiaRpc({ baseURL: url })
  const transactionHash = getTrxHash(digest, signature)
  const isValid = await rpcShard.broadcastTransaction(transactionPayload)
  assert(isValid, 'Unknown Error')

  return buildTransactionResult(rpc, rpcShard, transactionHash)
}

export const createTransactionFromPartisiaClient = async (
  rpc: PartisiaAccountClass,
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
  const url = rpc.getShardUrl(shardId)
  const rpcShard = PartisiaRpc({ baseURL: url })

  return buildTransactionResult(rpc, rpcShard, transaction.trxHash)
}

export const createTransactionFromPrivateKey = async (
  rpc: PartisiaAccountClass,
  contractAddress: string,
  privateKey: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 8490
): Promise<ITransactionIntent> => {
  const walletAddress = privateKeyToAccountAddress(privateKey)
  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)

  const serializedTransaction = await serializeTransaction(rpc, walletAddress, contractAddress, payload, cost)

  const digest = deriveDigest(
    `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`,
    serializedTransaction
  )
  const signature = signTransaction(digest, privateKey)
  const trx = getTransactionPayloadData(serializedTransaction, signature)

  const transactionHash = getTrxHash(digest, signature)
  const rpcShard = PartisiaRpc({ baseURL: url })

  const isValid = await rpcShard.broadcastTransaction(trx)
  assert(isValid, 'Unknown Error')

  return buildTransactionResult(rpc, rpcShard, transactionHash)
}
