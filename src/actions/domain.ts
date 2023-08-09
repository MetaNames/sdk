import { BN, ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { builderToBytesBe } from '../actions'
import { IActionApproveMintFees, IActionDomainMint } from '../interface'


export const actionDomainMintPayload = (contractAbi: ContractAbi, params: IActionDomainMint): Buffer => {
  if (!contractAbi.getFunctionByName('mint')) throw new Error('Function mint not found in contract abi')

  const rpc = new FnRpcBuilder('mint', contractAbi)
  rpc.addString(params.domain)
  rpc.addAddress(params.to)
  const tokenUriOption = rpc.addOption()
  if (params.token_uri) tokenUriOption.addString(params.token_uri)

  const parentOption = rpc.addOption()
  if (params.parent_domain) parentOption.addString(params.parent_domain)

  return builderToBytesBe(rpc)
}

export const actionApproveMintFeesPayload = (contractAbi: ContractAbi, params: IActionApproveMintFees): Buffer => {
  const rpc = new FnRpcBuilder('approve', contractAbi)

  const spender = params.address
  rpc.addAddress(spender)

  const amount = new BN(params.amount)
  rpc.addStruct()
    .addSizedByteArray(amount.toArrayLike(Buffer, 'be', 16))


  return builderToBytesBe(rpc)
}
