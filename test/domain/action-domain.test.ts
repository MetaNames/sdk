import { IActionDomainMint } from '../../src/interface'
import { config, generateRandomString } from '../helpers'

const domainName = `${generateRandomString(15)}.meta`

test('run action mint', async () => {
  const randomActionMint: IActionDomainMint = {
    domain: domainName,
    to: config.address,
  }
  const result = await config.metaNames.domainRepository.register(randomActionMint)

  expect(result.isFinalOnChain).toBe(true)
  expect(result.hasError).toBe(false)
}, 10_000)

// Need to run after the previous test
test('run action find', async () => {
  const domain = await config.metaNames.domainRepository.find(domainName)

  expect(domain).toBeDefined()
}, 10_000)
