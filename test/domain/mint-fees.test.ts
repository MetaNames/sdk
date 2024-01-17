import { config } from "../helpers"

test('mint fees transaction', async () => {
  const domainName = 'verycheapfees.meta'
  const { transactionHash, fetchResult } = await config.metaNames.domainRepository.approveMintFees(domainName)
  const result = await fetchResult

  expect(transactionHash).toBeDefined()
  expect(transactionHash).toBe(result.transactionHash)
  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.eventTrace.length).toBeGreaterThan(0)
}, 10_000)
