import { ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { IActionRecordDelete, IActionRecordMint, IActionRecordUpdate } from '../interface'
import { builderToBytesBe } from './helper'

export const actionRecordMintPayload = (contractAbi: ContractAbi, params: IActionRecordMint): Buffer => {
  if (!contractAbi.getFunctionByName('mint_record')) throw new Error('Function mint_record not found in contract abi')

  const rpc = new FnRpcBuilder('mint_record', contractAbi)
  addCommonRecordArgs(rpc, params)
  addDataArg(rpc, params.data)

  return builderToBytesBe(rpc)
}

export const actionRecordUpdatePayload = (contractAbi: ContractAbi, params: IActionRecordUpdate): Buffer => {
  if (!contractAbi.getFunctionByName('update_record')) throw new Error('Function update_record not found in contract abi')

  const rpc = new FnRpcBuilder('update_record', contractAbi)
  addCommonRecordArgs(rpc, params)
  addDataArg(rpc, params.data)

  return builderToBytesBe(rpc)
}

export const actionRecordDeletePayload = (contractAbi: ContractAbi, params: IActionRecordDelete): Buffer => {
  if (!contractAbi.getFunctionByName('delete_record')) throw new Error('Function delete_record not found in contract abi')

  const rpc = new FnRpcBuilder('delete_record', contractAbi)
  addCommonRecordArgs(rpc, params)

  return builderToBytesBe(rpc)
}

const addCommonRecordArgs = (rpc: FnRpcBuilder, params: IActionRecordMint | IActionRecordUpdate | IActionRecordDelete) => {
  rpc.addString(params.domain)
  rpc.addEnumVariant(params.class)
}

const addDataArg = (rpc: FnRpcBuilder, data: string | Buffer) => {
  const dataBytes = typeof data === 'string' ? Buffer.from(data) : data
  rpc.addVecU8(dataBytes)
}
