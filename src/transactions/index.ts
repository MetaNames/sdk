import BN from "bn.js"
import type { PartisiaAccountClass } from 'partisia-blockchain-applications-rpc/lib/main/accountInfo'
import { BufferWriter } from "./buffer-write"

export const TRANSACTION_TTL = 60_000

export interface TransactionHeader {
  nonce: number
  validTo: string
  cost: string
}

/**
 * Serialize a transaction into bytes
 */
export const serializeTransaction = async (
  rpc: PartisiaAccountClass,
  walletAddress: string,
  contractAddress: string,
  payload: Buffer,
  cost: number | string
) => {
  const shardId = rpc.deriveShardId(walletAddress)
  const nonce = await rpc.getNonce(walletAddress, shardId)
  const validTo = String(new Date().getTime() + TRANSACTION_TTL)

  return serialize(
    contractAddress,
    {
      cost: String(cost),
      nonce,
      validTo,
    },
    payload
  )
}

function serialize(
  contractAddress: string,
  header: TransactionHeader,
  payload: Buffer
): Buffer {
  const bufferWriter = new BufferWriter()
  serializeTransactionInner(bufferWriter, header)
  bufferWriter.writeHexString(contractAddress)
  bufferWriter.writeDynamicBuffer(payload)
  return bufferWriter.toBuffer()
}

function serializeTransactionInner(bufferWriter: BufferWriter, inner: TransactionHeader) {
  bufferWriter.writeLongBE(new BN(inner.nonce))
  bufferWriter.writeLongBE(new BN(inner.validTo))
  bufferWriter.writeLongBE(new BN(inner.cost))
}
