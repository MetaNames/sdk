import { BN, ContractAbi, FnRpcBuilder } from '@partisiablockchain/abi-client'
import { builderToBytesBe } from '../actions'
import { IActionApproveMintFees, IActionDomainMintPayload, IActionDomainTransferPayload, IActionRenewDomainPayload } from '../interface'


export const actionDomainMintPayload = (contractAbi: ContractAbi, params: IActionDomainMintPayload): Buffer => {
  if (!contractAbi.getFunctionByName('mint')) throw new Error('Function mint not found in contract abi')

  const rpc = new FnRpcBuilder('mint', contractAbi)
  rpc.addString(params.domain)

  const address = typeof params.to === 'string' ? Buffer.from(params.to, 'hex') : params.to
  rpc.addAddress(address)

  rpc.addU64(params.byocTokenId)

  const tokenUriOption = rpc.addOption()
  if (params.tokenUri) tokenUriOption.addString(params.tokenUri)

  const parentOption = rpc.addOption()
  if (params.parentDomain) parentOption.addString(params.parentDomain)

  const subscriptionYearsOption = rpc.addOption()
  if (params.subscriptionYears) subscriptionYearsOption.addU32(params.subscriptionYears)

  return builderToBytesBe(rpc)
}

export const actionDomainMintBatchPayload = (contractAbi: ContractAbi, params: IActionDomainMintPayload[]): Buffer => {
  const rpc = new FnRpcBuilder('mint_batch', contractAbi)

  const vecBuilder = rpc.addVec()
  params.forEach((param) => {
    const structBuilder = vecBuilder.addStruct()

    structBuilder.addString(param.domain)

    const address = typeof param.to === 'string' ? Buffer.from(param.to, 'hex') : param.to
    structBuilder.addAddress(address)

    structBuilder.addU64(param.byocTokenId)

    const tokenUriOption = structBuilder.addOption()
    if (param.tokenUri) tokenUriOption.addString(param.tokenUri)

    const parentOption = structBuilder.addOption()
    if (param.parentDomain) parentOption.addString(param.parentDomain)

    const subscriptionYearsOption = structBuilder.addOption()
    if (param.subscriptionYears) subscriptionYearsOption.addU32(param.subscriptionYears)
  })

  return builderToBytesBe(rpc)
}

export const actionApproveMintFeesPayload = (contractAbi: ContractAbi, params: IActionApproveMintFees): Buffer => {
  const rpc = new FnRpcBuilder('approve', contractAbi)

  const spender = typeof params.address === 'string' ? Buffer.from(params.address, 'hex') : params.address
  rpc.addAddress(spender)

  const amount = new BN(params.amount)
  rpc.addU128(amount)

  return builderToBytesBe(rpc)
}

export const actionDomainRenewalPayload = (contractAbi: ContractAbi, params: IActionRenewDomainPayload): Buffer => {
  const rpc = new FnRpcBuilder('renew_subscription', contractAbi)

  rpc.addString(params.domain)
  rpc.addU64(params.byocTokenId)

  const payer = typeof params.payer === 'string' ? Buffer.from(params.payer, 'hex') : params.payer
  rpc.addAddress(payer)

  rpc.addU32(params.subscriptionYears ?? 1)

  return builderToBytesBe(rpc)
}

export const actionDomainTransferFromPayload = (contractAbi: ContractAbi, params: IActionDomainTransferPayload): Buffer => {
  const rpc = new FnRpcBuilder('transfer_from', contractAbi)

  const { from, to, tokenId } = params

  rpc.addAddress(from)
  rpc.addAddress(to)
  rpc.addU128(new BN(tokenId))

  return builderToBytesBe(rpc)
}
