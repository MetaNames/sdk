import assert from 'assert'
import { partisiaCrypto } from 'partisia-crypto'
import { PartisiaRpc } from 'partisia-blockchain-applications-rpc'
import { PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'
import { PartisiaRpcClass } from 'partisia-blockchain-applications-rpc/lib/main/rpc'
import { ITransactionIntent, MetaMaskSdk } from '../interface'
import { AbiOutputBytes, FnRpcBuilder, } from '@partisiablockchain/abi-client'
import type PartisiaSdk from 'partisia-sdk'
import { BigEndianByteOutput } from '@secata-public/bitmanipulation-ts'

export const builderToBytesBe = (rpc: FnRpcBuilder) => {
  const bitOutput = new BigEndianByteOutput()
  const abiOutputBits = new AbiOutputBytes(bitOutput)
  rpc.write(abiOutputBits)

  return bitOutput.toBuffer()
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
  const chainId = `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`
  const digest = partisiaCrypto.transaction.deriveDigest(
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
  const transactionHash = partisiaCrypto.transaction.getTrxHash(digest, signature)
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
  const walletAddress = partisiaCrypto.wallet.privateKeyToAccountAddress(privateKey)
  const shardId = rpc.deriveShardId(walletAddress)
  const url = rpc.getShardUrl(shardId)

  const serializedTransaction = await serializeTransaction(rpc, walletAddress, contractAddress, payload, cost)

  const digest = partisiaCrypto.transaction.deriveDigest(
    `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`,
    serializedTransaction
  )
  const signature = partisiaCrypto.wallet.signTransaction(digest, privateKey)
  const trx = partisiaCrypto.transaction.getTransactionPayloadData(serializedTransaction, signature)

  const transactionHash = partisiaCrypto.transaction.getTrxHash(digest, signature)
  const rpcShard = PartisiaRpc({ baseURL: url })

  const isValid = await rpcShard.broadcastTransaction(trx)
  assert(isValid, 'Unknown Error')

  return buildTransactionResult(rpc, rpcShard, transactionHash)
}

const buildTransactionResult = (rpc: PartisiaAccountClass,
  rpcShard: PartisiaRpcClass,
  transactionHash: string) => {
  return {
    transactionHash,
    fetchResult: transactionResult(rpc, rpcShard, transactionHash)
  }
}


const transactionResult = async (
  rpc: PartisiaAccountClass,
  rpcShard: PartisiaRpcClass,
  transactionHash: string
) => {
  const isFinalOnChain = await broadcastTransactionPoller(transactionHash, rpcShard)

  let transactionResult
  if (isFinalOnChain) {
    transactionResult = await rpc.getTransactionEventTrace(transactionHash)
  } else {
    transactionResult = {
      hasError: true,
      errorMessage: 'unable to broadcast to chain',
      eventTrace: [],
    }
  }

  return {
    transactionHash,
    ...transactionResult,
  }
}

const broadcastTransactionPoller = async (
  trxHash: string,
  rpc: PartisiaRpcClass,
  num_iter = 10,
  interval_sleep = 2000
) => {
  let intCounter = 0
  while (++intCounter < num_iter) {
    try {
      const resTx = await rpc.getTransaction(trxHash)
      if (resTx.finalized) {
        break
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (!error.message.includes('404')) console.error(error.message)
    } finally {
      const sleep = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
      }
      await sleep(interval_sleep)
    }
  }
  return intCounter < num_iter
}

const serializeTransaction = async (
  rpc: PartisiaAccountClass,
  walletAddress: string,
  contractAddress: string,
  payload: Buffer,
  cost: number | string
) => {
  const shardId = rpc.deriveShardId(walletAddress)
  const nonce = await rpc.getNonce(walletAddress, shardId)

  return partisiaCrypto.transaction.serializedTransaction(
    { nonce, cost },
    { contract: contractAddress },
    payload
  )
}
