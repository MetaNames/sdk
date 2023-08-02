import { config } from "../helpers"

test('mint fees transaction', async () => {
  const domainName = 'verycheapfees.meta'
  const result = await config.metaNames.domainRepository.approveMintFees(domainName, config.address)

  expect(result).toBeDefined()
  expect(result.hasError).toBeFalsy()
  expect(result.isFinalOnChain).toBeTruthy()
}, 10_000)
