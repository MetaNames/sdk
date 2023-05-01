import { ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { BigEndianByteOutput } from '@secata-public/bitmanipulation-ts'
import assert from 'assert'
import { partisiaCrypto } from 'partisia-crypto'
import { PartisiaRpc } from 'partisia-rpc'
import { PartisiaAccountClass } from 'partisia-rpc/lib/main/accountInfo'
import { PartisiaRpcClass } from 'partisia-rpc/lib/main/rpc'
import { IActionMint, ITransactionResult } from './interface'

export const builderToBytesBe = (rpc: FnRpcBuilder) => {
  const bufferWriter = new BigEndianByteOutput()
  rpc.write(bufferWriter)
  return bufferWriter.toBuffer()
}

export const actionMintPayload = (contractAbi: ContractAbi, params: IActionMint): Buffer => {
  if (!contractAbi.getFunctionByName('mint')) throw new Error('Function mint not found in contract abi')

  const rpc = new FnRpcBuilder('mint', contractAbi)
  rpc.addString(params.token_id)
  rpc.addAddress(params.to)
  const option = rpc.addOption()
  if (params.parent) option.addString(params.parent)

  return builderToBytesBe(rpc)
}

export const createTransaction = async (
  rpc: PartisiaAccountClass,
  contractAddress: string,
  privateKey: string,
  payload: Buffer,
  isMainnet = false,
  cost: number | string = 40960
): Promise<ITransactionResult> => {
  const address = partisiaCrypto.wallet.privateKeyToAccountAddress(privateKey)

  const shardId = rpc.deriveShardId(address)
  const url = rpc.getShardUrl(shardId)
  const nonce = await rpc.getNonce(address, shardId)

  const serializedTransaction = partisiaCrypto.transaction.serializedTransaction(
    { nonce, cost },
    { contract: contractAddress },
    payload
  )

  const digest = partisiaCrypto.transaction.deriveDigest(
    `Partisia Blockchain${isMainnet ? '' : ' Testnet'}`,
    serializedTransaction
  )
  const signature = partisiaCrypto.wallet.signTransaction(digest, privateKey)
  const trx = partisiaCrypto.transaction.getTransactionPayloadData(serializedTransaction, signature)

  const trxHash = partisiaCrypto.transaction.getTrxHash(digest, signature)
  const rpcShard = PartisiaRpc({ baseURL: url })
  const isValid = await rpcShard.broadcastTransaction(trx)
  assert(isValid, 'Unknown Error')

  const isFinalOnChain = await broadcastTransactionPoller(trxHash, rpcShard)

  // check for errors
  let transactionResult
  if (isFinalOnChain) {
    transactionResult = await rpc.getTransactionEventTrace(trxHash)
  } else {
    transactionResult = {
      hasError: true,
      errorMessage: 'unable to broadcast to chain',
    }
  }

  return {
    isFinalOnChain,
    trxHash,
    ...transactionResult,
  }
}

export const broadcastTransactionPoller = async (
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
