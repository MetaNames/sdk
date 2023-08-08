import { BN, ScValueMap, ScValueNumber, ScValueString, ScValueStruct, ScValueVector } from '@partisiablockchain/abi-client-ts'
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


export function getDomainNamesByOwner(domains: ScValueMap, owners: ScValueMap, ownerAddress: Buffer): string[] {
  const nftIds: number[] = []
  owners.map.forEach((address, nftId) => {
    if (address.addressValue().value.equals(ownerAddress)) nftIds.push(nftId.asBN().toNumber())
  })
  if (!nftIds.length) return []

  const domainNames: string[] = []
  domains.map.forEach((domain, name) => {
    const tokenId = domain.structValue().fieldsMap.get('token_id')?.asBN().toNumber()
    if (!tokenId || !nftIds.includes(tokenId)) return

    domainNames.push(name.stringValue())
  })

  return domainNames
}

export function lookUpDomain(domains: ScValueMap, domainName: string): IDomain | undefined {
  const scNameString = new ScValueString(domainName)

  const domain = domains.get(scNameString)?.structValue()
  if (!domain) return

  const fieldsMap = domain.fieldsMap
  const scRecords = fieldsMap.get('records')?.mapValue().map

  const tokenId = (fieldsMap.get('token_id') as ScValueNumber).number
  return {
    name: domainName,
    tokenId: tokenId instanceof BN ? tokenId.toNumber() : tokenId,
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

function convertScVectorToBuffer(vector: ScValueVector): Buffer {
  return Buffer.from(vector.values().map((v) => v.asNumber()))
}
