import { RpcContractBuilder } from "@partisiablockchain/abi-client"
import type { PartisiaAccountClass, PartisiaRpcClass } from "../rpc/types"

export const builderToBytesBe = (rpc: RpcContractBuilder) => {
  return rpc.getBytes()
}

export const getChainId = (isMainnet: boolean): string => `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`

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
