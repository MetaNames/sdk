import { ScValueMap, ScValueString, ScValueStruct } from '@partisiablockchain/abi-client-ts'

export function getPnsRecords(contract: ScValueStruct): ScValueMap {
  const pns = contract.fieldsMap.get('pns')
  if (!pns) throw new Error('Pns key not found')

  const pnsStruct = pns.structValue()
  const records = pnsStruct.fieldsMap.get('records')
  if (!records) throw new Error('Records key not found')

  return records.mapValue()
}

export function lookUpRecord(records: ScValueMap, qualifiedName: string): string | undefined {
  const scNameString = new ScValueString(qualifiedName)

  return records.get(scNameString)?.structValue()?.fieldsMap.get('data')?.stringValue()
}
