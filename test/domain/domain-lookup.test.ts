import { config } from '../helpers'

test('lookup domains by owner', async () => {
  const domains = await config.metaNames.domainRepository.findByOwner(config.address)

  expect(domains.length).toBeGreaterThan(0)

  const domain = domains[0]
  expect(domain).toHaveProperty('name')
  expect(domain).toHaveProperty('tokenId')
  expect(domain).toHaveProperty('parentId')
  expect(domain).toHaveProperty('records')
})
