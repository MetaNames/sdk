import { config } from "../helpers"

test('mint fees transaction', async () => {
  const domainName = 'verycheapfees.meta'
  const { transactionHash, fetchResult } = await config.metaNames.domainRepository.approveMintFees(domainName, 'TEST_COIN')
  const result = await fetchResult

  expect(transactionHash).toBeDefined()
  expect(transactionHash).toBe(result.transactionHash)
  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.eventTrace.length).toBeGreaterThan(0)
}, 10_000)

test('mint fees amount', async () => {
  const domainName = 'verycheap.meta'

  const { fees, symbol, feesLabel } = await config.metaNames.domainRepository.calculateMintFees(domainName, 'TEST_COIN')

  expect(fees).toBeDefined()
  expect(fees).toBeGreaterThan(0)
  expect(symbol).toBeDefined()
  expect(symbol).toBe('TEST_COIN')
  expect(feesLabel).toBeDefined()
  expect(feesLabel).toBeGreaterThan(0)
  expect(feesLabel).toBe(10)
})
