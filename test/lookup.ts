// TEST LOOKUP OF A DOMAIN

import { MetaNamesContract } from '../src/contract'
import { testNetConfig } from '../src/config'
import { RecordClassEnum } from '../src/interface'
import assert from 'assert'

const domain = 'name.meta'
const recordClass = RecordClassEnum.Wallet
const expectedLookup = '00373c68dfed999aec39063194e2d3e0870f9899fa'

const metaNamesContract = new MetaNamesContract(testNetConfig.contractAddress, testNetConfig.rpcConfig)

const main = async () => {
  const data = await metaNamesContract.recordLookup(recordClass, domain)
  assert(data === expectedLookup, 'Lookup failed')
}

main()
