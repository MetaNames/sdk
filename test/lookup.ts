// TEST LOOKUP OF A DOMAIN

import { MetaNamesContract } from '../src/contract'
import { testNetRpcConfig } from '../src/config'
import { RecordClassEnum } from '../src/interface'
import assert from 'assert'

const addressContract = '02085dec3ccfc0a573289db11b4dd703b39f1614a2'
const rpcConfig = testNetRpcConfig
const domain = 'name.meta'
const recordClass = RecordClassEnum.Wallet
const expectedLookup = '00373c68dfed999aec39063194e2d3e0870f9899fa'

const metaNamesContract = new MetaNamesContract(addressContract, rpcConfig)

const main = async () => {
  const data = await metaNamesContract.lookUpRecord(domain, recordClass)
  assert(data === expectedLookup, 'Lookup failed')
}

main()
