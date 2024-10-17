import { AbiOutputBytes, FnRpcBuilder } from "@partisiablockchain/abi-client"
import { BigEndianByteOutput } from "@secata-public/bitmanipulation-ts"
import { serializedTransaction } from "partisia-blockchain-applications-crypto/lib/main/transaction"
import { PartisiaAccountClass } from "partisia-blockchain-applications-rpc/lib/main/accountInfo"
import { PartisiaRpcClass } from "partisia-blockchain-applications-rpc/lib/main/rpc"

export const builderToBytesBe = (rpc: FnRpcBuilder) => {
  const bitOutput = new BigEndianByteOutput()
  const abiOutputBits = new AbiOutputBytes(bitOutput)
  rpc.write(abiOutputBits)

  return bitOutput.toBuffer()
}

export const getChainId = (isMainnet: boolean): string => `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`

export const serializeTransaction = async (
  rpc: PartisiaAccountClass,
  walletAddress: string,
  contractAddress: string,
  payload: Buffer,
  cost: number | string,
  validityInMillis: number = 120_000
) => {
  const shardId = rpc.deriveShardId(walletAddress)
  const nonce = await rpc.getNonce(walletAddress, shardId)
  // Need to pass a number otherwise the internal library will throw an error
  const validTo = (new Date().getTime() + validityInMillis) as unknown as string

  return serializedTransaction(
    { nonce, cost, validTo },
    { contract: contractAddress },
    payload
  )
}

export const buildTransactionResult = (rpc: PartisiaAccountClass,
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
    } catch (error) {
      if (error instanceof Error && !error.message.includes('404')) console.error(error.message)
    } finally {
      const sleep = (ms: number) => {
        return new Promise((resolve) => setTimeout(resolve, ms))
      }
      await sleep(interval_sleep)
    }
  }
  return intCounter < num_iter
}
