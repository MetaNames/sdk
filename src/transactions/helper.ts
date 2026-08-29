import type { RpcContractBuilder } from "@partisiablockchain/abi-client"
import type { ITransactionResult } from "../interface"
import type { ShardedClient } from "../repositories/helpers/sharded-client"

export const builderToBytesBe = (rpc: RpcContractBuilder) => {
  return rpc.getBytes()
}

export const getChainId = (isMainnet: boolean): string => `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`

export const buildTransactionResult = (
  client: ShardedClient,
  shardId: number,
  transactionHash: string
) => {
  return {
    transactionHash,
    fetchResult: transactionResult(client, shardId, transactionHash)
  }
}

const transactionResult = async (
  client: ShardedClient,
  shardId: number,
  transactionHash: string
): Promise<ITransactionResult> => {
  const isFinalOnChain = await broadcastTransactionPoller(client, shardId, transactionHash)

  const transactionResult = isFinalOnChain
    ? await client.getTransactionEventTrace(transactionHash, shardId)
    : {
      hasError: true,
      errorMessage: 'unable to broadcast to chain',
      eventTrace: [],
    }

  return {
    transactionHash,
    ...transactionResult,
  }
}

const broadcastTransactionPoller = async (
  client: ShardedClient,
  shardId: number,
  transactionHash: string,
  attempts = 10,
  intervalInMillis = 2000
) => {
  let attempt = 0
  while (++attempt < attempts) {
    try {
      const transaction = await client.getTransaction(transactionHash, shardId)
      if (transaction?.finalized) break
    } catch (error) {
      if (error instanceof Error && !error.message.includes('404')) console.error(error.message)
    } finally {
      await new Promise((resolve) => setTimeout(resolve, intervalInMillis))
    }
  }

  return attempt < attempts
}
