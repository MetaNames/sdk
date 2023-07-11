import { MetaNamesContract } from '../src/contract'
import { testNetConfig } from '../src/config'
import { RecordClassEnum } from '../src/interface'
import { config, mintDomainAndRecord } from './helpers'

test('lookup domain', async () => {
  const domain = 'name.meta'
  const recordClass = RecordClassEnum.Wallet
  const expectedLookup = '00373c68dfed999aec39063194e2d3e0870f9899fa'

  let data = await config.metaNamesContract.recordLookup(recordClass, domain)
  if (!data) {
    // mint domain and record
    await mintDomainAndRecord(domain, recordClass, expectedLookup)
  }

  data = await config.metaNamesContract.recordLookup(recordClass, domain)
  expect(data).toBe(expectedLookup)
}, 20_000)
