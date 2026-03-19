import { AbstractBuilder, ContractAbi, RpcContractBuilder } from '@partisiablockchain/abi-client'
import { IActionRecordDelete, IActionRecordMint, IActionRecordUpdate } from '../interface'
import { builderToBytesBe } from '../transactions/helper'

export const actionRecordMintPayload = (contractAbi: ContractAbi, params: IActionRecordMint): Buffer => {
  const rpc = new RpcContractBuilder(contractAbi, 'mint_record')
  addCommonRecordArgs(rpc, params)
  addDataArg(rpc, params.data)

  return builderToBytesBe(rpc)
}

export const actionRecordMintBatchPayload = (contractAbi: ContractAbi, params: IActionRecordMint[]): Buffer => {
  if (!contractAbi.getFunctionByName('mint_record_batch')) throw new Error('Function mint_record_batch not found in contract abi')

  const rpc = new RpcContractBuilder(contractAbi, 'mint_record_batch')
  const vecBuilder = rpc.addVec()
  params.forEach((param) => {
    const structBuilder = vecBuilder.addStruct()
    addCommonRecordArgs(structBuilder, param)
    addDataArg(structBuilder, param.data)
  })

  return builderToBytesBe(rpc)
}

export const actionRecordUpdatePayload = (contractAbi: ContractAbi, params: IActionRecordUpdate): Buffer => {
  const rpc = new RpcContractBuilder(contractAbi, 'update_record')
  addCommonRecordArgs(rpc, params)
  addDataArg(rpc, params.data)

  return builderToBytesBe(rpc)
}

export const actionRecordDeletePayload = (contractAbi: ContractAbi, params: IActionRecordDelete): Buffer => {
  const rpc = new RpcContractBuilder(contractAbi, 'delete_record')
  addCommonRecordArgs(rpc, params)

  return builderToBytesBe(rpc)
}

const addCommonRecordArgs = (rpc: AbstractBuilder, params: IActionRecordMint | IActionRecordUpdate | IActionRecordDelete) => {
  rpc.addString(params.domain)
  rpc.addEnumVariant(params.class)
}

const addDataArg = (rpc: AbstractBuilder, data: string | Buffer) => {
  const dataBytes = typeof data === 'string' ? Buffer.from(data) : data
  rpc.addVecU8(dataBytes)
}
