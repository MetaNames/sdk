import { BN, ScValueMap, ScValueNumber, ScValueString, ScValueStruct, ScValueVector, TypeIndex } from '@partisiablockchain/abi-client'
import { IDomain, RecordClassEnum } from './interface'

export function getPnsDomains(contract: ScValueStruct): ScValueMap {
  const pns = contract.fieldsMap.get('pns')
  if (!pns) throw new Error('Pns key not found')

  const pnsStruct = pns.structValue()
  const domains = pnsStruct.fieldsMap.get('domains')

  if (!domains) throw new Error('Records key not found')

  return domains.mapValue()
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


export function getDomainNamesByOwner(domains: ScValueMap, owners: ScValueMap, ownerAddress: Buffer): string[] {
  const nftIds: number[] = []
  owners.map.forEach((address, nftId) => {
    if (address.addressValue().value.equals(ownerAddress)) nftIds.push(nftId.asBN().toNumber())
  })
  if (!nftIds.length) return []

  const domainNames: string[] = []
  domains.map.forEach((domain, name) => {
    const tokenId = domain.structValue().fieldsMap.get('token_id')?.asBN().toNumber()

    if (tokenId === undefined || !nftIds.includes(tokenId)) return

    domainNames.push(name.stringValue())
  })

  return domainNames
}

export function lookUpDomain(domains: ScValueMap, owners: ScValueMap, domainName: string): IDomain | undefined {
  const scNameString = new ScValueString(domainName)

  const domain = domains.get(scNameString)?.structValue()
  if (!domain) return

  const fieldsMap = domain.fieldsMap
  const created = fieldsMap.get('minted_at')!.asBN().toNumber()
  const createdAt = new Date(created)

  const expires = fieldsMap.get('expires_at')?.optionValue().innerValue?.asBN().toNumber()
  const expiresAt = expires ? new Date(expires) : undefined

  const scRecords = fieldsMap.get('records')?.mapValue().map

  const tokenId = fieldsMap.get('token_id')!.asBN().toNumber()
  const owner = getOwnerAddressOf(owners, tokenId)
  if (!owner) throw new Error('Owner not found')

  return {
    name: domainName,
    tld: 'meta',
    createdAt,
    expiresAt,
    owner,
    tokenId,
    parentId: fieldsMap.get('parent_id')?.optionValue().innerValue?.stringValue(),
    records: scRecords ? extractRecords(new ScValueMap(scRecords)) : new Map(),
  }
}

export function lookUpRecord(domain: IDomain, recordClass: RecordClassEnum): string | Buffer | undefined {
  const recordClassName = RecordClassEnum[recordClass]

  return domain.records.get(recordClassName)
}

export function extractRecords(records: ScValueMap): Map<string, string> {
  const extractedRecords = new Map<string, string>()

  for (const [scKey, scValue] of records.mapValue().map) {
    const key = scKey.enumValue().name
    const data = scValue.structValue().fieldsMap.get('data')
    if (!data) continue

    const vectorData = convertScVectorToBuffer(data.vecValue())

    extractedRecords.set(key, vectorData.toString())
  }

  return extractedRecords
}

export function getMintFeesInGas(contract: ScValueStruct, domain: string): number {
  const config = contract.fieldsMap.get('config')!.structValue()
  const mintFees = config.fieldsMap.get('mint_fees')
  if (!mintFees) throw new Error('Mint gas key not found')

  const mintGasStruct = mintFees.structValue()
  const gasMapping = mintGasStruct.fieldsMap.get('mapping')?.vecValue()
  if (!gasMapping) throw new Error('Gas mapping not found')

  const domainLength = domain.length
  const defaultFee = mintGasStruct.fieldsMap.get('default_fee')
  let gasAmount: number = defaultFee!.asBN().toNumber()

  const gasStruct = gasMapping.values().find((v) => v.structValue().fieldsMap.get('chars_count')!.asBN().toNumber() === domainLength)
  if(gasStruct) gasAmount = gasStruct.structValue().fieldsMap.get('gas')!.asBN().toNumber()

  if (!gasAmount) throw new Error('Gas amount not found')

  return gasAmount
}

function convertScVectorToBuffer(vector: ScValueVector): Buffer {
  return Buffer.from(vector.values().map((v) => v.asNumber()))
}
