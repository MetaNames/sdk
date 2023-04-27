import { ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { BigEndianByteOutput } from '@secata-public/bitmanipulation-ts'
import { PartisiaRpcClass } from 'partisia-rpc/lib/main/rpc'
import { IActionMint } from './interface'

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
