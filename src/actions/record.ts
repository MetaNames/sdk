import { ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { IActionRecordMint } from '../interface'
import { builderToBytesBe } from './helper'

export const actionRecordMintPayload = (contractAbi: ContractAbi, params: IActionRecordMint): Buffer => {
  if (!contractAbi.getFunctionByName('mint_record')) throw new Error('Function mint_record not found in contract abi')

  const rpc = new FnRpcBuilder('mint_record', contractAbi)
  rpc.addString(params.domain)
  rpc.addEnumVariant(params.class)
  const dataBytes = typeof params.data === 'string' ? Buffer.from(params.data) : params.data
  rpc.addVecU8(dataBytes)

  return builderToBytesBe(rpc)
}
