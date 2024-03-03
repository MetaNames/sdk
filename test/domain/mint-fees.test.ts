import { config } from "../helpers"

test('mint fees transaction for TEST_COINT', async () => {
  const domainName = 'verycheapfees.mpc'
  const { transactionHash, fetchResult } = await config.sdk.domainRepository.approveMintFees(domainName, 'TEST_COIN')
  const result = await fetchResult

  expect(transactionHash).toBeDefined()
  expect(transactionHash).toBe(result.transactionHash)
  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.eventTrace.length).toBeGreaterThan(0)
}, 20_000)

test('mint fees transaction for ETH', async () => {
  const domainName = 'verycheapfees.mpc'
  const { transactionHash, fetchResult } = await config.sdk.domainRepository.approveMintFees(domainName, 'ETH_GOERLI')
  const result = await fetchResult

  expect(transactionHash).toBeDefined()
  expect(transactionHash).toBe(result.transactionHash)
  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.eventTrace.length).toBeGreaterThan(0)
}, 20_000)

test('mint fees amount TEST_COIN', async () => {
  const domainName = 'verycheap.mpc'

  const { fees, symbol, feesLabel } = await config.sdk.domainRepository.calculateMintFees(domainName, 'TEST_COIN')

  expect(fees).toBeDefined()
  expect(fees.toNumber()).toBe(10)
  expect(symbol).toBeDefined()
  expect(symbol).toBe('TEST_COIN')
  expect(feesLabel).toBeDefined()
  expect(feesLabel).toBe(10)
})

test('mint fees amount ETH_GOERLI', async () => {
  const domainName = 'verycheap.mpc'

  const { fees, symbol, feesLabel } = await config.sdk.domainRepository.calculateMintFees(domainName, 'ETH_GOERLI')

  expect(fees).toBeDefined()
  expect(fees.toNumber()).toBe(3500000000000000)
  expect(symbol).toBeDefined()
  expect(symbol).toBe('ETH_GOERLI')
  expect(feesLabel).toBeDefined()
  expect(feesLabel).toBe(0.0035)
})

test('mint fees for compounded emoji', async () => {
  const domainName = '👩‍👩‍👧‍👦.mpc'

  const { fees, symbol, feesLabel } = await config.sdk.domainRepository.calculateMintFees(domainName, 'TEST_COIN')

  expect(fees).toBeDefined()
  expect(fees.toNumber()).toBe(10)
  expect(symbol).toBeDefined()
  expect(symbol).toBe('TEST_COIN')
  expect(feesLabel).toBeDefined()
  expect(feesLabel).toBe(10)
})
