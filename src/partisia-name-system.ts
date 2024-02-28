import { BN, ScValue, ScValueAvlTreeMap, ScValueMap, ScValueNumber, ScValueString, ScValueStruct, ScValueVector, TypeIndex } from '@partisiablockchain/abi-client'
import { IDomain, RecordClassEnum } from './interface'

export function getPnsDomains(contract: ScValueStruct): ScValueAvlTreeMap {
  const pns = contract.fieldsMap.get('pns')
  if (!pns) throw new Error('Pns key not found')

  const pnsStruct = pns.structValue()
  const domains = pnsStruct.fieldsMap.get('domains')

  if (!domains) throw new Error('Domains key not found')

  return domains.avlTreeMapValue()
}

export function getDomainCount(contract: ScValueStruct): number {
  const nfts = contract.fieldsMap.get('nft')
  if (!nfts) throw new Error('Nft key not found')
  const nftStruct = nfts.structValue()
  const nftCount = nftStruct.fieldsMap.get('supply')
  if (!nftCount) throw new Error('Supply key not found')

  return nftCount.asBN().toNumber()
}

export function getNftOwners(contract: ScValueStruct): ScValueMap {
  const nfts = contract.fieldsMap.get('nft')
  if (!nfts) throw new Error('Nft key not found')

  const nftStruct = nfts.structValue()
  const owners = nftStruct.fieldsMap.get('owners')
  if (!owners) throw new Error('Owners key not found')

  return owners.mapValue()
}

export function getOwnerAddressOf(owners: ScValueMap, tokenId: number) {
  const tokenIdBN = new BN(tokenId)
  const nftId = new ScValueNumber(TypeIndex.u128, tokenIdBN)
  return owners.get(nftId)?.addressValue().value.toString('hex')
}


export function getDomainNamesByOwner(domains: ScValueAvlTreeMap, owners: ScValueMap, ownerAddress: Buffer): string[] {
  const nftIds: number[] = []
  owners.map.forEach((address, nftId) => {
    if (address.addressValue().value.equals(ownerAddress)) nftIds.push(nftId.asBN().toNumber())
  })
  if (!nftIds.length) return []
  if (!domains.map) return []

  const domainNames: string[] = []
  domains.map.forEach((domain, name) => {
    const tokenId = domain.structValue().fieldsMap.get('token_id')?.asBN().toNumber()

    if (tokenId === undefined || !nftIds.includes(tokenId)) return

    domainNames.push(name.stringValue())
  })

  return domainNames
}

export function lookUpDomain(domains: ScValueAvlTreeMap, owners: ScValueMap, domainName: string, tld: string): IDomain | undefined {
  if (!domains.map) return

  const scNameString = new ScValueString(domainName)
  const domain = domains.map.get(scNameString)?.structValue()
  if (!domain) return

  return decorateDomain(domain, owners, domainName, tld)
}

export function decorateDomain(domain: ScValueStruct, owners: ScValueMap, domainName: string, tld: string): IDomain {
  const fieldsMap = domain.fieldsMap
  const created = (fieldsMap.get('minted_at') as ScValue).asBN().toNumber()
  const createdAt = new Date(created)

  const expires = fieldsMap.get('expires_at')?.optionValue().innerValue?.asBN().toNumber()
  const expiresAt = expires ? new Date(expires) : undefined

  const scRecords = fieldsMap.get('records')?.mapValue().map

  const tokenId = (fieldsMap.get('token_id') as ScValue).asBN().toNumber()
  const owner = getOwnerAddressOf(owners, tokenId)
  if (!owner) throw new Error('Owner not found')

  return {
    name: domainName,
    tld,
    createdAt,
    expiresAt,
    owner,
    tokenId,
    parentId: fieldsMap.get('parent_id')?.optionValue().innerValue?.stringValue(),
    records: scRecords ? extractRecords(new ScValueMap(scRecords)) : {},
  }
}

export function lookUpRecord(domain: IDomain, recordClass: RecordClassEnum): string | Buffer | undefined {
  const recordClassName = RecordClassEnum[recordClass]

  return domain.records[recordClassName]
}

export function extractRecords(records: ScValueMap) {
  const extractedRecords: Record<string, string> = {}

  for (const [scKey, scValue] of records.mapValue().map) {
    const key = scKey.enumValue().name
    const data = scValue.structValue().fieldsMap.get('data')
    if (!data) continue

    const vectorData = convertScVectorToBuffer(data.vecValue())

    extractedRecords[key] = vectorData.toString()
  }

  return extractedRecords
}

function getPaymentInfo(contract: ScValueStruct, paymentId: number): ScValueStruct {
  const config = (contract.fieldsMap.get('config') as ScValue).structValue()
  const paymentInfo = (config.fieldsMap.get('payment_info') as ScValue).vecValue()

  const payment = paymentInfo.values().find((v) => (v.structValue().fieldsMap.get('id') as ScValue).asBN().toNumber() === paymentId)
  if (!payment) throw new Error('Payment info not found')

  return payment.structValue()
}

export function getMintFees(contract: ScValueStruct, domain: string, tokenId: number): BN {
  const payment = getPaymentInfo(contract, tokenId)
  const fees = payment.fieldsMap.get('fees')
  if (!fees) throw new Error('Mint gas key not found')

  const feesStruct = fees.structValue()
  const feesMapping = feesStruct.fieldsMap.get('mapping')?.vecValue()
  if (!feesMapping) throw new Error('Fees mapping not found')

  let domainLength = domain.length

  try {
    domainLength = [...new Intl.Segmenter().segment('👩‍👩‍👧‍👦')].length
  } catch(e) {
    console.log(e)
  }

  const defaultFee = feesStruct.fieldsMap.get('default_fee') as ScValue
  const decimals = (feesStruct.fieldsMap.get('decimals') as ScValue).asBN().toNumber()
  let fee = defaultFee.asBN().toNumber()

  const feeStruct = feesMapping.values().find((v) => (v.structValue().fieldsMap.get('chars_count') as ScValue).asBN().toNumber() === domainLength)
  if (feeStruct) fee = (feeStruct.structValue().fieldsMap.get('amount') as ScValue).asBN().toNumber()

  if (!fee) throw new Error('Amount not found')

  let feeBN = new BN(fee)
  feeBN = feeBN.mul(getDecimalsMultiplier(decimals))

  return feeBN
}

function convertScVectorToBuffer(vector: ScValueVector): Buffer {
  return Buffer.from(vector.values().map((v) => v.asNumber()))
}

export function getDecimalsMultiplier(decimals: number): BN {
  return new BN(10).pow(new BN(decimals))
}

