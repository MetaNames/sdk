import { IActionDomainMint, IActionDomainRenewal } from '../../src/interface'
import { config, generateRandomString } from '../helpers'

const domainName = `${generateRandomString(15)}.meta`

test('run action mint', async () => {
  const randomActionMint: IActionDomainMint = {
    domain: domainName,
    to: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { transactionHash, fetchResult } = await config.metaNames.domainRepository.register(randomActionMint)
  const result = await fetchResult

  expect(transactionHash).toBeDefined()
  expect(transactionHash.length).toBe(64)
  expect(transactionHash).toBe(result.transactionHash)
  expect(result.hasError).toBe(false)
  expect(result.eventTrace.length).toBeGreaterThan(0)
}, 10_000)

test('run action renew', async () => {
  const randomActionRenew: IActionDomainRenewal = {
    domain: domainName,
    subscriptionYears: 1,
    payer: config.address,
    byocSymbol: 'TEST_COIN'
  }
  const { transactionHash, fetchResult } = await config.metaNames.domainRepository.renew(randomActionRenew)
  const result = await fetchResult

  expect(transactionHash).toBeDefined()
  expect(transactionHash.length).toBe(64)
  expect(transactionHash).toBe(result.transactionHash)
  expect(result.hasError).toBe(false)
  expect(result.eventTrace.length).toBeGreaterThan(0)
}, 10_000)

test('run action count', async () => {
  const count = await config.metaNames.domainRepository.count()

  expect(count).toBeGreaterThan(0)
})
