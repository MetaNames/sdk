import { BN, ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { IActionApproveMintFees, IActionDomainMint } from '../interface'
import { builderToBytesBe } from '../actions'


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

export const actionApproveMintFeesPayload = (params: IActionApproveMintFees): Buffer => {
  const rpc = new FnRpcBuilder(Buffer.from('05', 'hex'))
  const spender = params.address
  const amount = new BN(params.amount)

  rpc.addAddress(spender)
  rpc.addU128(amount)

  return builderToBytesBe(rpc)
}
