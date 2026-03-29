import {
  BlockchainTransactionClient,
  SenderAuthenticationKeyPair,
  BlockchainAddress,
  SenderAuthentication,
} from "@partisiablockchain/blockchain-api-transaction-client"
import type { SentTransaction } from "@partisiablockchain/blockchain-api-transaction-client"

export interface TransactionClient {
  signAndSend(
    address: string,
    rpc: Buffer,
    gasCost: number,
    validToTime: number
  ): Promise<{ transactionHash: string; sentTransaction: SentTransaction }>
}

export function createTransactionClient(
  baseUrl: string,
  privateKey: string
): TransactionClient {
  const auth = SenderAuthenticationKeyPair.fromString(privateKey)
  const client = BlockchainTransactionClient.create(baseUrl, auth)

  return {
    async signAndSend(
      address: string,
      rpc: Buffer,
      gasCost: number,
      _validToTime: number
    ): Promise<{ transactionHash: string; sentTransaction: SentTransaction }> {
      const transaction = {
        address: address as BlockchainAddress,
        rpc,
      }

      try {
        const sentTransaction = await client.signAndSend(transaction, gasCost)
        return {
          transactionHash: sentTransaction.transactionPointer.identifier,
          sentTransaction,
        }
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
    },
  }
}

export function createTransactionClientWithAuth(
  baseUrl: string,
  auth: SenderAuthentication
): TransactionClient {
  const client = BlockchainTransactionClient.create(baseUrl, auth)

  return {
    async signAndSend(
      address: string,
      rpc: Buffer,
      gasCost: number,
      _validToTime: number
    ): Promise<{ transactionHash: string; sentTransaction: SentTransaction }> {
      const transaction = {
        address: address as BlockchainAddress,
        rpc,
      }

      try {
        const sentTransaction = await client.signAndSend(transaction, gasCost)
        return {
          transactionHash: sentTransaction.transactionPointer.identifier,
          sentTransaction,
        }
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
    },
  }
}
