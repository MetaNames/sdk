import { PartisiaRpc, PartisiaAccountClass } from "../rpc"
import type LedgerTransport from "@ledgerhq/hw-transport"
import { ITransactionIntent, MetaMaskSdk } from "../interface"
import { PartisiaLedgerClient, signatureToBuffer } from "./ledger"
import { buildTransactionResult, getChainId } from "./helper"
import type { PartisiaSdk } from "../types/partisia-sdk"
import { privateKeyToAccountAddress } from "../crypto"
import { createTransactionClient } from "../rpc/transaction-client"
import {
  BlockchainTransactionClient,
  BlockchainAddress,
  Signature,
  SenderAuthentication,
} from "@partisiablockchain/blockchain-api-transaction-client"

export const createTransactionFromLedgerClient = async (
  rpc: PartisiaAccountClass,
  transport: LedgerTransport,
  contractAddress: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 10490
): Promise<ITransactionIntent> => {
  const ledgerClient = new PartisiaLedgerClient(transport)
  const walletAddress: string = await ledgerClient.getAddress()
  const globalUrl = rpc.getGlobalUrl()
  const chainId = getChainId(isMainnet)

  const auth: SenderAuthentication = {
    getAddress(): BlockchainAddress {
      return walletAddress as BlockchainAddress
    },
    async sign(transactionPayload: Buffer, _chainId: string): Promise<Signature> {
      const signature = await ledgerClient.signTransaction(transactionPayload, chainId)
      const sigBuffer = signatureToBuffer(signature)
      return sigBuffer.toString("hex") as Signature
    },
  }

  const client = BlockchainTransactionClient.create(globalUrl, auth)

  const costNum = typeof cost === "string" ? parseInt(cost, 10) : cost
  const validToTime = new Date().getTime() + 120_000

  const transactionHash = await signAndSend(client, contractAddress, payload, costNum, validToTime)

  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)
  const rpcShard = PartisiaRpc({ shardURL: url, globalURL: globalUrl })

  return buildTransactionResult(rpc, rpcShard, transactionHash)
}

export const createTransactionFromMetaMaskClient = async (
  rpc: PartisiaAccountClass,
  metaMaskClient: MetaMaskSdk,
  contractAddress: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 10490
): Promise<ITransactionIntent> => {
  const snapId = "npm:@partisiablockchain/snap"
  const walletAddress: string = await metaMaskClient.request({
    method: "wallet_invokeSnap",
    params: { snapId, request: { method: "get_address" } },
  })
  const globalUrl = rpc.getGlobalUrl()
  const chainId = getChainId(isMainnet)

  const auth: SenderAuthentication = {
    getAddress(): BlockchainAddress {
      return walletAddress as BlockchainAddress
    },
    async sign(transactionPayload: Buffer, _chainId: string): Promise<Signature> {
      const signatureHex: string = await metaMaskClient.request({
        method: "wallet_invokeSnap",
        params: {
          snapId,
          request: {
            method: "sign_transaction",
            params: {
              payload: transactionPayload.toString("hex"),
              chainId
            },
          },
        },
      })
      return signatureHex as Signature
    },
  }

  const client = BlockchainTransactionClient.create(globalUrl, auth)

  const costNum = typeof cost === "string" ? parseInt(cost, 10) : cost
  const validToTime = new Date().getTime() + 120_000

  const transactionHash = await signAndSend(client, contractAddress, payload, costNum, validToTime)

  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)
  const rpcShard = PartisiaRpc({ shardURL: url, globalURL: globalUrl })

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
  const serializedTransaction = await serializeTransactionWithClient(rpc, walletAddress, contractAddress, payload, cost)

  const transaction = await client.signMessage({
    payload: serializedTransaction.toString("hex"),
    payloadType: "hex",
    dontBroadcast: false,
  })

  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)
  const globalUrl = rpc.getGlobalUrl()
  const rpcShard = PartisiaRpc({ shardURL: url, globalURL: globalUrl })

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
  const globalUrl = rpc.getGlobalUrl()
  const txClient = createTransactionClient(globalUrl, privateKey)

  const walletAddress = privateKeyToAccountAddress(privateKey)
  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)
  const validToTime = new Date().getTime() + 120_000
  const costNum = typeof cost === "string" ? parseInt(cost, 10) : cost

  const { transactionHash } = await txClient.signAndSend(contractAddress, payload, costNum, validToTime)

  const rpcShard = PartisiaRpc({ shardURL: url, globalURL: globalUrl })

  return buildTransactionResult(rpc, rpcShard, transactionHash)
}

async function signAndSend(
  client: BlockchainTransactionClient,
  address: string,
  rpc: Buffer,
  gasCost: number,
  _validToTime: number
): Promise<string> {
  const transaction = {
    address: address as BlockchainAddress,
    rpc,
  }

  try {
    const sentTransaction = await client.signAndSend(transaction, gasCost)
    return sentTransaction.transactionPointer.identifier
  } catch (error) {
    if (error && typeof error === 'object' && 'response' in error) {
      const err = error as { response?: { url?: string; status?: number; statusText?: string; clone?: () => { text: () => Promise<string> } } }
      console.error("Transaction error:", {
        url: err.response?.url,
        status: err.response?.status,
        statusText: err.response?.statusText,
      })
      if (err.response?.clone) {
        try {
          const body = await err.response.clone().text()
          console.error("Response body:", body)
        } catch {
          console.error("Could not read response body")
        }
      }
    }
    throw error
  }
}

import { RpcContractBuilder } from "@partisiablockchain/abi-client"

async function serializeTransactionWithClient(
  rpc: PartisiaAccountClass,
  walletAddress: string,
  contractAddress: string,
  payload: Buffer,
  cost: number | string
): Promise<Buffer> {
  const shardId = rpc.deriveShardId(walletAddress)
  const nonce = await rpc.getNonce(walletAddress, shardId)
  const validTo = new Date().getTime() + 120_000
  const costNum = typeof cost === "string" ? parseInt(cost, 10) : cost

  const nonceBytes = intToBuffer(parseInt(nonce, 10), 8)
  const validToBytes = intToBuffer(validTo, 8)
  const costBytes = intToBuffer(costNum, 8)
  const addressBytes = Buffer.from(contractAddress, "hex")
  const rpcLengthBytes = intToBuffer(payload.length, 4)

  return Buffer.concat([
    nonceBytes,
    validToBytes,
    costBytes,
    addressBytes,
    rpcLengthBytes,
    payload,
  ])
}

function intToBuffer(value: number, bytes: number): Buffer {
  const buf = Buffer.alloc(bytes)
  for (let i = bytes - 1; i >= 0; i--) {
    buf[i] = value & 0xff
    value = Math.floor(value / 256)
  }
  return buf
}

export { serializeTransactionWithClient as serializeTransaction }
