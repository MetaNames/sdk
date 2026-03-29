import { ChainControllerApi, Configuration, ShardControllerApi } from "@partisiablockchain/blockchain-api-transaction-client"

interface PartisiaRpcOptions {
  shardURL: string
  globalURL: string
}

export function PartisiaRpc(options: PartisiaRpcOptions): {
  getTransaction(trxHash: string): Promise<{ finalized: boolean }>
  broadcastTransaction(transactionPayload: string): Promise<boolean>
} {
  const shardController = new ShardControllerApi(
    new Configuration({ basePath: options.globalURL })
  )
  const chainController = new ChainControllerApi(
    new Configuration({ basePath: options.globalURL })
  )

  return {
    async getTransaction(trxHash: string): Promise<{ finalized: boolean }> {
      try {
        const tx = await shardController.getTransaction({
          shardId: "Shard0",
          transactionId: trxHash,
        })
        return {
          finalized: tx.executionStatus !== undefined && tx.executionStatus !== null,
        }
      } catch (error) {
        console.error("getTransaction error:", error)
        return { finalized: false }
      }
    },

    async broadcastTransaction(transactionPayload: string): Promise<boolean> {
      try {
        await chainController.putTransaction({
          serializedTransaction: {
            payload: transactionPayload,
          },
        })
        return true
      } catch (error) {
        if (error && typeof error === 'object' && 'response' in error) {
          const err = error as { response?: { url?: string; status?: number; statusText?: string } }
          console.error("broadcastTransaction error:", {
            url: err.response?.url,
            status: err.response?.status,
            statusText: err.response?.statusText,
          })
        } else {
          console.error("broadcastTransaction error:", error)
        }
        return false
      }
    },
  }
}
