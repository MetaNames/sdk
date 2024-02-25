import { config, mintDomain } from "../helpers"

const oldDomainName = 'name.meta'
const domainName = 'name.mpc'

beforeAll(async () => {
  const domain = await config.sdk.domainRepository.find(domainName)
  if (!domain) await mintDomain(domainName)
}, 15_000)


test('domain lookup with old tld works', async () => {
  const domain = await config.sdk.domainRepository.find(oldDomainName)

  expect(domain).toBeDefined()
  expect(domain!.name).toBe(domainName)
  expect(domain!.tld).toBe('mpc')
})

test('domain analyze with old tld works', async () => {
  const domain = await config.sdk.domainRepository.analyze(oldDomainName)

  expect(domain).toBeDefined()
  expect(domain!.name).toBe(domainName)
  expect(domain!.tld).toBe('mpc')
})
