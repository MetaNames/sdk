import { ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { IActionDomainMint } from '../interface'
import { builderToBytesBe } from '../actions'


export const actionMintPayload = (contractAbi: ContractAbi, params: IActionDomainMint): Buffer => {
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
