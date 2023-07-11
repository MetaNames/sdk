import { ScValueEnum, ScValueMap, ScValueString, ScValueStruct } from '@partisiablockchain/abi-client-ts'
import { RecordClassEnum } from './interface'

export function getPnsDomains(contract: ScValueStruct): ScValueMap {
  const pns = contract.fieldsMap.get('pns')
  if (!pns) throw new Error('Pns key not found')

  const pnsStruct = pns.structValue()
  const domains = pnsStruct.fieldsMap.get('domains')
  if (!domains) throw new Error('Records key not found')

  return domains.mapValue()
}

export function lookUpDomain(domains: ScValueMap, domain: string): ScValueStruct | undefined {
  const scNameString = new ScValueString(domain)

  return domains.get(scNameString)?.structValue()
}

export function lookUpRecord(domain: ScValueStruct, recordClass: RecordClassEnum): string | undefined {
  const records = domain.fieldsMap.get('records')?.mapValue()
  const recordClassName = RecordClassEnum[recordClass]
  const recordStruct = new ScValueStruct(recordClassName, new Map())
  const klass = new ScValueEnum(recordClassName, recordStruct)

  const data = records?.get(klass)?.structValue()?.fieldsMap.get('data')
  if (!data) return

  const vectorData = Buffer.from(data!.vecValue().values().map((v) => v.asNumber()))

  return vectorData.toString()
}
