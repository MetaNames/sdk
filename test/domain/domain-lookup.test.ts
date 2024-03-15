import { config } from '../helpers'

test('lookup domains by owner', async () => {
  const domains = await config.sdk.domainRepository.findByOwner(config.address)

  expect(domains.length).toBeGreaterThan(0)

  const domain = domains[0]
  expect(domain).toHaveProperty('name')
  expect(domain).toHaveProperty('tokenId')
  expect(domain).toHaveProperty('parentId')
  expect(domain).toHaveProperty('records')
}, 20_000)

test('get all domains', async () => {
  const domains = await config.sdk.domainRepository.getAll()

  expect(domains.length).toBeGreaterThan(0)
  expect(domains[0]).toHaveProperty('name')
}, 20_000)
