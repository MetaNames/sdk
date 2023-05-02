import { MetaNamesContract } from '../src/contract'
import { testNetConfig } from '../src/config'
import { RecordClassEnum } from '../src/interface'

test('lookup domain', async () => {
  const domain = 'name.meta'
  const recordClass = RecordClassEnum.Wallet
  const expectedLookup = '00373c68dfed999aec39063194e2d3e0870f9899fa'

  const metaNamesContract = new MetaNamesContract(testNetConfig.contractAddress, testNetConfig.rpcConfig)
  const data = await metaNamesContract.recordLookup(recordClass, domain)
  expect(data).toBe(expectedLookup)
})
