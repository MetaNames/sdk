import { BN, ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client-ts'
import { builderToBytesBe } from '../actions'
import { IActionApproveMintFees, IActionDomainMint } from '../interface'


export const actionDomainMintPayload = (contractAbi: ContractAbi, params: IActionDomainMint): Buffer => {
  if (!contractAbi.getFunctionByName('mint')) throw new Error('Function mint not found in contract abi')

  const rpc = new FnRpcBuilder('mint', contractAbi)
  rpc.addString(params.domain)

  const address = typeof params.to === 'string' ? Buffer.from(params.to, 'hex') : params.to
  rpc.addAddress(address)

  const tokenUriOption = rpc.addOption()
  if (params.tokenUri) tokenUriOption.addString(params.tokenUri)

  const parentOption = rpc.addOption()
  if (params.parentDomain) parentOption.addString(params.parentDomain)

  const subscriptionYearsOption = rpc.addOption()
  if (params.subscriptionYears) subscriptionYearsOption.addU32(params.subscriptionYears)

  return builderToBytesBe(rpc)
}

export const actionApproveMintFeesPayload = (contractAbi: ContractAbi, params: IActionApproveMintFees): Buffer => {
  const rpc = new FnRpcBuilder('approve', contractAbi)

  const spender = typeof params.address === 'string' ? Buffer.from(params.address, 'hex') : params.address
  rpc.addAddress(spender)

  const amount = new BN(params.amount)
  rpc.addStruct()
    .addSizedByteArray(amount.toArrayLike(Buffer, 'be', 16))


  return builderToBytesBe(rpc)
}
