import { ScValueMap, ScValueString, ScValueStruct } from '@partisiablockchain/abi-client-ts'

export function getPnsRecords(contract: ScValueStruct): ScValueMap {
  const pnsStruct = contract.fieldsMap.get('pns')!.structValue()
  const records = pnsStruct.fieldsMap.get('records')
  return records!.mapValue()
}

export function lookUpRecord(records: ScValueMap, qualifiedName: string): string | undefined {
  const scNameString = new ScValueString(qualifiedName)

  return records.get(scNameString)?.structValue()?.fieldsMap.get('data')?.stringValue()
}
